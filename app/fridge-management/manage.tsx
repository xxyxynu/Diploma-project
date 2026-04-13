import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Share, Text, TouchableOpacity, View } from "react-native";
import { fridgeApi } from "../../api/fridge";
import { translations } from "../../i18n/translations";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore } from "../../store/userStore";
import Toast from "react-native-toast-message";

export default function ManageFridges() {
    const router = useRouter();
    const { fridges, removeFridge, selectedFridge } = useFridgeStore();
    const { userInfo, language } = useUserStore();
    const t = translations[language];

    const [loading, setLoading] = useState(false);

    const handleInvite = async (fridgeId: string, fridgeName: string) => {
        try {
            const data = await fridgeApi.generateInviteCode(fridgeId);
            const code = data.inviteCode;

            await Share.share({
                message: `${t.joinMyFridge(fridgeName)} ${code}`,
                title: t.shareInviteTitle
            });

            Toast.show({
                type: 'success',
                text1: t.invite,
                text2: t.postSuccess
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.failedShareCode
            });
        }
    };

    const handleLeaveOrDelete = async (fridge: any) => {
        const isOwner = fridge.ownerId._id === userInfo?._id;

        Alert.alert(
            isOwner ? t.deleteFridgeTitle : t.leaveFridge,
            isOwner ? t.deleteAllWarning : t.leaveConfirm,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: isOwner ? t.delete : t.leaveFridge,
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (isOwner) {
                                await fridgeApi.deleteFridge(fridge._id);
                            } else {
                                await fridgeApi.leaveFridge(fridge._id);
                            }
                            removeFridge(fridge._id);
                            Toast.show({
                                type: 'success',
                                text1: t.postSuccess,
                                text2: isOwner ? t.fridgeDeleted : t.leftFridge
                            });
                        } catch (error: any) {
                            Toast.show({
                                type: 'error',
                                text1: t.detailError,
                                text2: error.response?.data?.message || t.actionFailed
                            });
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }: { item: any }) => {
        const isOwner = item.ownerId._id === userInfo?._id;
        const isSelected = selectedFridge?._id === item._id;

        return (
            <View className="bg-white p-5 rounded-2xl mb-4 border border-gray-100 shadow-sm">
                <View className="flex-row items-center mb-4">
                    <View className="w-12 h-12 bg-gray-50 rounded-full items-center justify-center mr-3">
                        <Text className="text-3xl">{item.emoji}</Text>
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center">
                            <Text className="font-pbold text-lg text-gray-800 mr-2">{item.name}</Text>
                            {isSelected && (
                                <View className="bg-green-100 px-2 py-0.5 rounded-md">
                                    <Text className="text-green-700 text-[10px] font-bold">
                                        {t.currentBadge}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-gray-500 text-xs">
                            {isOwner ? t.youAreOwner : t.ownerLabel(item.ownerId.name)}
                        </Text>
                    </View>
                </View>

                <View className="h-[1px] bg-gray-100 mb-3" />

                <View className="flex-row justify-end gap-3">
                    {/* Invite — owner only */}
                    {isOwner && (
                        <TouchableOpacity
                            onPress={() => handleInvite(item._id, item.name)}
                            className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg"
                        >
                            <Ionicons name="share-social-outline" size={18} color="#2563EB" />
                            <Text className="text-blue-600 font-pbold text-xs ml-1">{t.invite}</Text>
                        </TouchableOpacity>
                    )}

                    {/* Leave / Delete */}
                    <TouchableOpacity
                        onPress={() => handleLeaveOrDelete(item)}
                        className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
                    >
                        <Ionicons
                            name={isOwner ? "trash-outline" : "exit-outline"}
                            size={18}
                            color="#DC2626"
                        />
                        <Text className="text-red-600 font-pbold text-xs ml-1">
                            {isOwner ? t.delete : t.leaveFridge}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-white pt-14 pb-4 px-6 border-b border-gray-100">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={28} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-pbold text-slate-800">{t.manageFridgesTitle}</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <FlatList
                data={fridges}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24 }}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">{t.noFridgesFound}</Text>
                }
            />
        </View>
    );
}
