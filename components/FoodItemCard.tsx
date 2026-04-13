import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { FridgeItem } from "../api/food";
import { useUserStore } from "@/store/userStore";
import { translations } from "../i18n/translations";

interface FoodItemCardProps {
    item: FridgeItem;
    onPress: () => void;
    onDelete?: () => void; // 可选的删除回调
    showDeleteButton?: boolean; // 是否显示删除按钮（首页可能不想显示太复杂的按钮）
}

export const FoodItemCard = ({ item, onPress, onDelete, showDeleteButton = true }: FoodItemCardProps) => {
    const { language } = useUserStore();
    const t = translations[language];

    // 计算剩余天数
    const now = new Date();
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // 根据状态决定颜色
    let badgeBg = "bg-green-100";
    let badgeText = "text-green-600";
    let iconName = "checkmark-circle-outline";

    if (item.status === 'expired') {
        badgeBg = "bg-red-100";
        badgeText = "text-red-500";
        iconName = "close-circle-outline";
    } else if (item.status === 'expiring') {
        badgeBg = "bg-orange-100";
        badgeText = "text-orange-500";
        iconName = "time-outline";
    }

    return (
        <TouchableOpacity
            onPress={onPress}
            // 如果传入了 onDelete，支持长按删除
            onLongPress={onDelete}
            className="bg-white p-3 rounded-[20px] flex-row items-center shadow-sm shadow-gray-100 border border-gray-50 mb-3"
        >
            {/* 1. 图片区域 */}
            <View className={`w-16 h-16 rounded-2xl items-center justify-center p-2 mr-4 ${item.status === 'expired' ? 'bg-red-50' : 'bg-gray-50'}`}>
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        className="w-full h-full rounded-xl"
                        resizeMode="contain"
                    />
                ) : (
                    <MaterialCommunityIcons name="food" size={32} color="#9CA3AF" />
                )}
            </View>

            {/* 2. 信息区域 */}
            <View className="flex-1">
                <Text className="text-slate-800 font-bold text-base" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="text-gray-400 text-xs mb-2">
                    {item.quantity} {t.units ? (t.units[item.unit as keyof typeof t.units] || item.unit) : item.unit}{item.brand ? ` • ${item.brand}` : ''}
                </Text>

                {/* 状态徽章 */}
                <View className={`self-start flex-row items-center px-2 py-1 rounded-lg ${badgeBg}`}>
                    <Ionicons
                        name={iconName as any}
                        size={12}
                        color={item.status === 'expired' ? "#ef4444" : item.status === 'expiring' ? "#f97316" : "#16a34a"}
                    />
                    <Text className={`text-xs font-bold ml-1 ${badgeText}`}>
                        {daysLeft < 0
                            ? t.expiredDays(Math.abs(daysLeft))
                            : daysLeft === 0
                                ? t.expiresToday
                                : t.daysLeft(daysLeft)}
                    </Text>
                </View>
            </View>

            {showDeleteButton && onDelete ? (
                <TouchableOpacity
                    onPress={onDelete}
                    className="p-2"
                >
                    <Ionicons name="trash-outline" size={20} color="#cbd5e1" />
                </TouchableOpacity>
            ) : (
                <Ionicons name="chevron-forward" size={20} color="#E2E8F0" />
            )}
        </TouchableOpacity>
    );
};