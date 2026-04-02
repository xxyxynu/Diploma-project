import { DetailBox } from "@/components/DetailBox";
import { useUserStore } from "@/store/userStore";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, FridgeItem } from "../../api/food";

const { width } = Dimensions.get("window");

export default function FoodDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [item, setItem] = useState<FridgeItem | null>(null);
    const [loading, setLoading] = useState(true);
    const { refreshUser } = useUserStore();

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await foodApi.getOne(id as string);
            setItem(data);
        } catch (error) {
            Alert.alert("Error", "Could not load item details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };


    const handleConsume = async () => {
        Alert.alert("Yum! 😋", `Did you finish the ${item?.name}?`, [
            { text: "Not yet", style: "cancel" },
            {
                text: "Yes, It was delicious!",
                onPress: async () => {
                    try {
                        // ✅ 改为 consume
                        await foodApi.consume(id as string);
                        refreshUser(); // 刷新积分

                        Alert.alert("Awesome!", "+10 Eco Points Added!");
                        router.replace("/(tabs)/fridge");
                    } catch (error) {
                        Alert.alert("Error", "Action failed.");
                    }
                }
            }
        ]);
    };

    // 2. 删除 (浪费)
    const handleDelete = async () => {
        Alert.alert("Delete Item", "Is this item wasted or just removed?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Just Remove", // 普通删除 (误操作录入时)
                onPress: async () => {
                    await foodApi.delete(id as string);
                    router.back();
                }
            },
            {
                text: "Wasted (Expired)", // 浪费
                style: "destructive",
                onPress: async () => {
                    // ✅ 改为 waste
                    await foodApi.waste(id as string);
                    refreshUser(); // 刷新数据
                    router.back();
                }
            }
        ]);
    };


    const handleEdit = () => {
        if (!item) return;
        router.push({
            pathname: "/add-manual",
            params: {
                id: item._id, // 👈 必须传 ID，AddManual 靠这个判断是否是编辑
                name: item.name,
                brand: item.brand,
                quantity: String(item.quantity), // 转字符串传过去比较稳
                unit: item.unit,
                category: item.category,
                // 转成 ISO 字符串，AddManual 会把它 new Date() 回来
                expiryDate: new Date(item.expiryDate).toISOString(),
                productionDate: item.productionDate ? new Date(item.productionDate).toISOString() : "",
                imageUrl: item.imageUrl,
                notes: item.notes
            }
        });
    };

    const getDaysLeft = () => {
        if (!item) return 0;
        const now = new Date();
        const expiry = new Date(item.expiryDate);
        return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    };

    const formatDate = (dateString: Date) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    const days = getDaysLeft();

    let statusColor = "#22c55e"; // Green
    let statusBg = "bg-green-100";
    let statusText = "Fresh";
    let statusIcon = "leaf";

    if (days < 0) {
        statusColor = "#ef4444"; // Red
        statusBg = "bg-red-100";
        statusText = "Expired";
        statusIcon = "alert-circle";
    } else if (days <= 3) {
        statusColor = "#f97316"; // Orange
        statusBg = "bg-orange-100";
        statusText = "Expiring Soon";
        statusIcon = "time";
    }

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator color="#22C55E" size="large" />
            </View>
        );
    }

    if (!item) return null;

    return (
        <View className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" />

            <View className="relative">
                <View className="w-full h-80 bg-white">
                    {item.imageUrl ? (
                        <Image
                            source={{ uri: item.imageUrl }}
                            className="w-full h-full"
                            resizeMode="contain"
                        />
                    ) : (
                        <View className={`w-full h-full items-center justify-center ${statusBg}`}>
                            <MaterialCommunityIcons name="food" size={120} color={statusColor} opacity={0.5} />
                        </View>
                    )}
                    <View className="absolute bottom-0 w-full h-32 bg-black/10" />
                </View>

                {/* 悬浮导航按钮 */}
                <View className="absolute top-14 left-6 right-6 flex-row justify-between z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-gray-200 backdrop-blur-md rounded-full items-center justify-center"
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleEdit}
                        className="w-10 h-10 bg-gray-200 backdrop-blur-md rounded-full items-center justify-center"
                    >
                        <Ionicons name="pencil" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                className="flex-1 -mt-10"
                contentContainerStyle={{ paddingBottom: 120 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="bg-gray-50 rounded-t-[40px] px-6 pt-8 pb-6 min-h-screen">

                    {/* 标题栏 */}
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 mr-4">
                            <Text className="text-3xl font-pbold text-slate-800 leading-tight">
                                {item.name}
                            </Text>
                            {item.brand && (
                                <Text className="text-lg text-gray-500 font-pmedium mt-1">
                                    {item.brand}
                                </Text>
                            )}
                        </View>
                        {/* 数量 Badge */}
                        <View className="bg-white border border-gray-100 px-4 py-3 rounded-2xl shadow-slate-300 items-center">
                            <Text className="text-2xl font-pbold text-slate-800">{item.quantity}</Text>
                            <Text className="text-xs text-gray-400 font-pbold uppercase">{item.unit}</Text>
                        </View>
                    </View>

                    {/* 状态栏 (Status Bar) */}
                    <View className={`w-full p-4 rounded-2xl flex-row items-center justify-between mb-6 ${statusBg}`}>
                        <View className="flex-row items-center">
                            <Ionicons name={statusIcon as any} size={24} color={statusColor} />
                            <View className="ml-3">
                                <Text className="text-base font-pbold" style={{ color: statusColor }}>
                                    {statusText}
                                </Text>
                                <Text className="text-xs text-gray-600 opacity-80">
                                    {days < 0 ? `Expired on ${formatDate(item.expiryDate)}` : `${days} days remaining`}
                                </Text>
                            </View>
                        </View>
                        {/* 简易进度条背景 */}
                        <View className="h-1.5 w-16 bg-black/5 rounded-full overflow-hidden">
                            {/* 这里的 width 应该是动态计算的，简单起见写死演示 */}
                            <View
                                className="h-full rounded-full"
                                style={{
                                    width: days <= 3 ? '80%' : '30%',
                                    backgroundColor: statusColor
                                }}
                            />
                        </View>
                    </View>

                    {/* 详细信息网格 */}
                    <Text className="text-gray-900 font-pbold text-lg mb-4">Details</Text>
                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {/* Category */}
                        <DetailBox
                            icon="grid-outline"
                            label="Category"
                            value={item.category}
                        />
                        {/* Expiry Date */}
                        <DetailBox
                            icon="calendar-outline"
                            label="Expires"
                            value={formatDate(item.expiryDate)}
                            highlight={days <= 3}
                        />
                        {/* Production Date */}
                        {item.productionDate && (
                            <DetailBox
                                icon="time-outline"
                                label="Produced"
                                value={formatDate(item.productionDate)}
                            />
                        )}
                        {/* Added Date */}
                        <DetailBox
                            icon="download-outline"
                            label="Added"
                            value={formatDate(item.createdAt)}
                        />
                    </View>

                    {/* 备注区域 */}
                    <Text className="text-gray-900 font-pbold text-lg mb-3">Notes</Text>
                    <View className="bg-white p-4 rounded-2xl border border-gray-100 min-h-[100px]">
                        {item.notes ? (
                            <Text className="text-gray-600 leading-6 font-pregular">{item.notes}</Text>
                        ) : (
                            <Text className="text-gray-400 italic">No notes added.</Text>
                        )}
                    </View>

                </View>
            </ScrollView>

            {/* 3. 底部固定按钮栏 */}
            <View className="absolute bottom-0 left-0 right-0 bg-white px-6 pt-4 pb-8 border-t border-gray-100 shadow-slate-500 rounded-t-[30px] flex-row gap-4">
                {/* Delete Button */}
                <TouchableOpacity
                    onPress={handleDelete}
                    className="flex-1 bg-gray-50 border border-gray-200 py-4 rounded-2xl flex-row justify-center items-center active:bg-gray-100"
                >
                    <Ionicons name="trash-outline" size={20} color="#64748b" />
                </TouchableOpacity>

                {/* Consume Button (Primary) */}
                <TouchableOpacity
                    onPress={handleConsume}
                    className="flex-[2] bg-primary py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-green-200 active:bg-green-600"
                >
                    <MaterialCommunityIcons name="silverware-fork-knife" size={20} color="white" />
                    <Text className="ml-2 font-pbold text-white text-lg">Eat it!</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
