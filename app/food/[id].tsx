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
                text: "Just Remove",
                onPress: async () => {
                    try {
                        await foodApi.delete(id as string);
                        router.back();
                    } catch (error) {
                        Alert.alert("Error", "Failed to remove item. Please try again.");
                    }
                }
            },
            {
                text: "Wasted (Expired)", // 浪费
                style: "destructive",
                onPress: async () => {
                    try {
                        await foodApi.waste(id as string);
                        refreshUser(); // 刷新数据
                        router.back();
                    } catch (error) {
                        Alert.alert("Error", "Failed to mark item as wasted. Please try again.");
                    }
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

            <View className="relative h-[45%]">
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full"
                        resizeMode="contain"
                    />
                ) : (
                    <View className={`w-full h-full items-center justify-center ${statusBg}`}>
                        <MaterialCommunityIcons name="food" size={100} color={statusColor} opacity={0.3} />
                    </View>
                )}
                {/* 顶部渐变遮罩，为了让白色按钮更清晰 */}
                <View className="absolute top-0 left-0 right-0 h-32 bg-black/20" />

                <View className="absolute top-14 left-6 right-6 flex-row justify-between z-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl items-center justify-center shadow-sm"
                    >
                        <Ionicons name="chevron-back" size={28} color="#1e293b" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={handleEdit}
                        className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl items-center justify-center shadow-sm"
                    >
                        <Ionicons name="ellipsis-horizontal" size={24} color="#1e293b" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* 内容主体：向上偏移覆盖图片底部 */}
            <ScrollView
                className="flex-1 -mt-12 bg-white rounded-t-[45px] shadow-2xl shadow-black/20"
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View className="px-8 pt-10">
                    {/* 核心信息 */}
                    <View className="flex-row justify-between items-start mb-8">
                        <View className="flex-1 mr-4">
                            <Text className="text-gray-400 font-pbold text-xs uppercase tracking-widest mb-1">
                                {item.category}
                            </Text>
                            <Text className="text-3xl font-pbold text-slate-900 leading-tight">
                                {item.name}
                            </Text>
                            {item.brand && (
                                <Text className="text-lg text-slate-500 font-pmedium">
                                    {item.brand}
                                </Text>
                            )}
                        </View>

                        {/* 价格/价值标识 */}
                        <View className="items-end">
                            <Text className="text-2xl font-pbold text-primary">₸ {item.price || 0}</Text>
                            <Text className="text-gray-400 text-xs font-psemibold">VALUE</Text>
                        </View>
                    </View>

                    {/* 状态磁贴：更现代的设计 */}
                    <View className={`rounded-[32px] p-6 mb-8 flex-row items-center ${statusBg}`}>
                        <View className="w-14 h-14 bg-white/60 rounded-2xl items-center justify-center mr-4">
                            <Ionicons name={statusIcon as any} size={32} color={statusColor} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-pbold uppercase opacity-60" style={{ color: statusColor }}>
                                Storage Status
                            </Text>
                            <Text className="text-xl font-pbold text-slate-900">
                                {days < 0 ? 'Expired' : `${days} Days Left`}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs font-pbold text-slate-400 mb-1">{item.quantity} {item.unit}</Text>
                            {/* 动态圆形进度 */}
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                        </View>
                    </View>

                    {/* Bento Grid 详情区块 */}
                    <View className="flex-row flex-wrap gap-4 mb-8">
                        <DetailBox
                            icon="calendar"
                            label="Best Before"
                            value={formatDate(item.expiryDate)}
                            subValue={days < 0 ? "Past" : "Upcoming"}
                        />
                        <DetailBox
                            icon="barcode"
                            label="Barcode"
                            value={item.barcode || "N/A"}
                        />
                    </View>

                    {/* 备注：带装饰的引用样式 */}
                    <View className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                        <Text className="text-slate-900 font-pbold text-lg mb-2">Chef's Notes</Text>
                        <Text className="text-slate-500 leading-6 font-pregular">
                            {item.notes || "No special instructions for this item."}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* 底部按钮：使用渐变背景或大圆角，增加触感反馈 */}
            <View className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl px-8 pt-4 pb-10 flex-row gap-4 items-center">
                <TouchableOpacity
                    onPress={handleDelete}
                    className="w-16 h-16 bg-slate-100 rounded-3xl items-center justify-center border border-slate-200"
                >
                    <Ionicons name="trash-outline" size={24} color="#ef4444" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleConsume}
                    activeOpacity={0.8}
                    className="flex-1 h-16 bg-primary rounded-3xl flex-row justify-center items-center shadow-lg shadow-green-200"
                >
                    <MaterialCommunityIcons name="silverware-fork-knife" size={24} color="white" />
                    <Text className="ml-3 font-pbold text-white text-xl">Eat & Save</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
