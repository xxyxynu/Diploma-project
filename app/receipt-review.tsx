import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, ScannedItem } from "../api/food";
import { useFridgeStore } from "../store/fridgeStore";
import { useUserStore } from "../store/userStore";
import { translations } from "../i18n/translations";
import Toast from "react-native-toast-message";

export default function ReceiptReviewScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { selectedFridge } = useFridgeStore();
    const { language } = useUserStore();
    const t = translations[language];

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [receiptItems, setReceiptItems] = useState<ScannedItem[]>([]);

    useEffect(() => {
        // 进入页面时，读取路由传过来的 base64 图片
        const base64Img = params.base64 as string;
        if (base64Img) {
            processReceipt(base64Img);
        } else {
            Alert.alert(t.detailError || "Error", t.noImageError, [{ text: t.goBack || "Back", onPress: () => router.back() }]);
        }
    }, []);

    // 1. 调用后端 API 处理图片
    const processReceipt = async (base64Img: string) => {
        try {
            const data = await foodApi.scanReceipt(base64Img, language);
            // 默认勾选所有识别出来的物品
            const itemsWithSelection = data.items.map(i => ({ ...i, selected: true }));
            setReceiptItems(itemsWithSelection);

            Toast.show({
                type: 'success',
                text1: t.postSuccess || "Success",
                text2: t.aiFoundItemsPrompt.slice(0, 30) + "...",
                position: 'bottom'
            });
        } catch (error: any) {
            Alert.alert(
                t.scanningFailed,
                error.response?.data?.message || t.failedToPost,
                [{ text: t.goBack || "Go Back", onPress: () => router.back() }]
            );
        } finally {
            setLoading(false);
        }
    };

    // 2. 切换选中状态
    const toggleItem = (index: number) => {
        const newItems = [...receiptItems];
        newItems[index].selected = !newItems[index].selected;
        setReceiptItems(newItems);
    };

    const handleSave = async () => {
        // 筛选出用户选中的物品
        const selectedItems = receiptItems
            .filter(i => i.selected)
            .map(({ selected, ...rest }) => rest); // 去掉 UI 专用的 selected 字段

        if (selectedItems.length === 0) {
            Toast.show({
                type: 'info',
                text1: t.noItemsSelected,
                text2: t.selectAtLeastOne
            });
            return;
        }

        if (!selectedFridge) {
            Toast.show({ type: 'error', text1: t.detailError, text2: t.noFridgeSelected });
            return;
        }

        setSaving(true);
        try {
            // 🚀 现在只需要发送一次网络请求
            await foodApi.createMany(selectedFridge!._id, selectedItems);

            Toast.show({
                type: 'success',
                text1: t.postSuccess,
                text2: t.saveSuccessReceipt(selectedItems.length),
            });

            router.push("/(tabs)/fridge")
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.failedToPost
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-gray-500 mt-6 text-center font-pbold text-lg">{t.aiReadingReceipt}</Text>
                <Text className="text-gray-400 mt-2 text-center">{t.extractingDetails}</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-primary pt-14 pb-4 px-6 border-b border-primary-dark flex-row justify-between items-center shadow-sm z-10">
                <TouchableOpacity onPress={() => router.back()} className="bg-white/20 p-2 rounded-full backdrop-blur-md">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white text-xl font-pbold">{t.reviewReceipt}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* List */}
            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="bg-green-50 p-4 rounded-xl border border-green-100 mb-6 flex-row items-start">
                    <MaterialCommunityIcons name="magic-staff" size={20} color="#16A34A" />
                    <Text className="text-green-800 font-pmedium ml-2 flex-1 text-sm leading-5">
                        {t.aiFoundItemsPrompt}
                    </Text>
                </View>

                {receiptItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.7}
                        onPress={() => toggleItem(index)}
                        className={`bg-white p-4 rounded-2xl mb-3 flex-row items-center border ${item.selected
                            ? 'border-green-400 shadow-sm shadow-green-100'
                            : 'border-gray-200 opacity-60'
                            }`}
                    >
                        <MaterialCommunityIcons
                            name={item.selected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                            size={24}
                            color={item.selected ? "#22C55E" : "#9CA3AF"}
                            style={{ marginRight: 12 }}
                        />
                        <View className="flex-1">
                            <Text className={`font-pbold text-base ${item.selected ? 'text-slate-800' : 'text-gray-500 line-through'}`}>
                                {item.name}
                            </Text>
                            <Text className="text-gray-500 text-xs mt-1">
                                {t.categories[item.category as keyof typeof t.categories] || item.category} • {item.quantity} {t.units ? (t.units[item.unit as keyof typeof t.units] || item.unit) : item.unit}
                            </Text>
                        </View>
                        {item.price ? (
                            <Text className={`font-bold ${item.selected ? 'text-slate-700' : 'text-gray-400'}`}>
                                ₸ {item.price}
                            </Text>
                        ) : null}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Footer Action */}
            <View className="absolute bottom-0 w-full p-6 bg-white border-t border-gray-100 pb-10 shadow-lg shadow-gray-200">
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving || receiptItems.filter(i => i.selected).length === 0}
                    className={`py-4 rounded-2xl flex-row items-center justify-center shadow-md ${saving || receiptItems.filter(i => i.selected).length === 0 ? 'bg-gray-300' : 'bg-primary shadow-green-200'
                        }`}
                >
                    {saving ? <ActivityIndicator color="white" /> : (
                        <>
                            <MaterialCommunityIcons name="fridge-outline" size={20} color="white" />
                            <Text className="text-white font-pbold text-lg ml-2">
                                {t.addItemsBtn(receiptItems.filter(i => i.selected).length)}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}