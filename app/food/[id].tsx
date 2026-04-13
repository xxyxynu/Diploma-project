import { DetailBox } from "@/components/DetailBox";
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
import { translations } from "../../i18n/translations";
import { useUserStore } from "../../store/userStore";
import Toast from "react-native-toast-message";

const { width } = Dimensions.get("window");

export default function FoodDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { refreshUser, language } = useUserStore();
    const t = translations[language];

    const [item, setItem] = useState<FridgeItem | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchDetail();
    }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await foodApi.getOne(id as string);
            setItem(data);
        } catch (error) {
            Alert.alert(t.detailError, t.couldNotLoadItem);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleConsume = async () => {
        Alert.alert("😋", t.yumTitle(item?.name ?? ""), [
            { text: t.notYet, style: "cancel" },
            {
                text: t.yesDelicious,
                onPress: async () => {
                    try {
                        await foodApi.consume(id as string);
                        refreshUser();
                        Toast.show({
                            type: 'success',
                            text1: t.awesomeTitle,
                            text2: t.itemConsumedSuccess,
                        });
                        router.replace("/(tabs)/fridge");
                    } catch (error) {
                        Toast.show({ type: 'error', text1: t.detailError, text2: t.actionFailed });
                    }
                }
            }
        ]);
    };

    const handleDelete = async () => {
        Alert.alert(t.deleteItemTitle, t.deleteItemDesc, [
            { text: t.cancel, style: "cancel" },
            {
                text: t.justRemove,
                onPress: async () => {
                    try {
                        await foodApi.delete(id as string);
                        Toast.show({ type: 'success', text1: t.itemRemovedSuccess });
                        router.back();
                    } catch (error) {
                        Toast.show({ type: 'error', text1: t.detailError, text2: t.failedRemoveItem });
                    }
                }
            },
            {
                text: t.wastedExpired,
                style: "destructive",
                onPress: async () => {
                    try {
                        await foodApi.waste(id as string);
                        refreshUser();
                        Toast.show({
                            type: 'info', // 浪费使用 info 颜色（灰色/蓝色），不鼓励也不报错
                            text1: t.wastedExpired,
                            text2: t.itemWastedSuccess
                        });
                        router.back();
                    } catch (error) {
                        Toast.show({ type: 'error', text1: t.detailError, text2: t.failedMarkWasted });
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
                id: item._id,
                name: item.name,
                brand: item.brand,
                quantity: String(item.quantity),
                unit: item.unit,
                category: item.category,
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
        return new Date(dateString).toLocaleDateString(t.dateLocale, {
            year: "numeric", month: "short", day: "numeric"
        });
    };

    const days = getDaysLeft();

    let statusColor = "#22c55e";
    let statusBg = "bg-green-100";
    let statusText = t.statusFresh;
    let statusIcon = "leaf";

    if (days < 0) {
        statusColor = "#ef4444";
        statusBg = "bg-red-100";
        statusText = t.statusExpired;
        statusIcon = "alert-circle";
    } else if (days <= 3) {
        statusColor = "#f97316";
        statusBg = "bg-orange-100";
        statusText = t.statusExpiringSoon;
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

            {/* Hero image / colour block */}
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

            {/* Main content */}
            <ScrollView
                className="flex-1 -mt-12 bg-white rounded-t-[45px] shadow-2xl shadow-black/20"
                contentContainerStyle={{ paddingBottom: 140 }}
            >
                <View className="px-8 pt-10">
                    {/* Name + price */}
                    <View className="flex-row justify-between items-start mb-8">
                        <View className="flex-1 mr-4">
                            <Text className="text-gray-400 font-pbold text-xs uppercase tracking-widest mb-1">
                                {t.categories[item.category] || item.category}
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
                        <View className="items-end">
                            <Text className="text-2xl font-pbold text-primary">₸ {item.price || 0}</Text>
                            <Text className="text-gray-400 text-xs font-psemibold">{t.value}</Text>
                        </View>
                    </View>

                    {/* Status tile */}
                    <View className={`rounded-[32px] p-6 mb-8 flex-row items-center ${statusBg}`}>
                        <View className="w-14 h-14 bg-white/60 rounded-2xl items-center justify-center mr-4">
                            <Ionicons name={statusIcon as any} size={32} color={statusColor} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xs font-pbold uppercase opacity-60" style={{ color: statusColor }}>
                                {t.storageStatus}
                            </Text>
                            <Text className="text-xl font-pbold text-slate-900">
                                {days < 0 ? t.statusExpired : t.daysLeft(days)}
                            </Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs font-pbold text-slate-400 mb-1">
                                {item.quantity} {item.unit}
                            </Text>
                            <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
                        </View>
                    </View>

                    {/* Bento detail boxes */}
                    <View className="flex-row flex-wrap gap-4 mb-8">
                        <DetailBox
                            icon="calendar"
                            label={t.bestBefore}
                            value={formatDate(item.expiryDate)}
                            subValue={days < 0 ? t.past : t.upcoming}
                        />
                        <DetailBox
                            icon="barcode"
                            label={t.barcode}
                            value={item.barcode || "N/A"}
                        />
                    </View>

                    {/* Notes */}
                    <View className="bg-slate-50 p-6 rounded-[28px] border border-slate-100">
                        <Text className="text-slate-900 font-pbold text-lg mb-2">{t.chefsNotes}</Text>
                        <Text className="text-slate-500 leading-6 font-pregular">
                            {item.notes || t.noNotes}
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Bottom action bar */}
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
                    <Text className="ml-3 font-pbold text-white text-xl">{t.eatAndSave}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
