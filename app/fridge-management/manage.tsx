import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, FlatList, Share, Text, TouchableOpacity, View } from "react-native";
import { fridgeApi } from "../../api/fridge";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore } from "../../store/userStore";

export default function ManageFridges() {
    const router = useRouter();
    const { fridges, removeFridge, selectedFridge, setSelectedFridge } = useFridgeStore();
    const { userInfo } = useUserStore();
    const [loading, setLoading] = useState(false);

    // 生成邀请码
    const handleInvite = async (fridgeId: string, fridgeName: string) => {
        try {
            // 先请求后端生成/获取 Code
            const data = await fridgeApi.generateInviteCode(fridgeId);
            const code = data.inviteCode;

            // 调用系统原生分享
            const result = await Share.share({
                message: `Hey! Join my fridge "${fridgeName}" on EcoCart using this invite code: ${code}`,
                // iOS 可以在这里加个 url，比如 App Store 链接
                // url: 'https://ecocart.app', 
                title: 'Join my Fridge' // Android 标题
            });

            if (result.action === Share.sharedAction) {
                if (result.activityType) {
                    // shared with activity type of result.activityType (iOS)
                    console.log("Shared via", result.activityType);
                } else {
                    // shared
                    console.log("Shared successfully");
                }
            } else if (result.action === Share.dismissedAction) {
                // dismissed
                console.log("Share dismissed");
            }
        } catch (error) {
            Alert.alert("Error", "Failed to share code");
        }
    };

    // 退出或删除
    const handleLeaveOrDelete = async (fridge: any) => {
        // 判断当前用户是不是 Owner
        // 注意：根据你的 Interface，ownerId 是个对象 {_id, name...}
        const isOwner = fridge.ownerId._id === userInfo?._id;

        Alert.alert(
            isOwner ? "Delete Fridge" : "Leave Fridge",
            isOwner
                ? "Are you sure? This will delete all items for everyone."
                : "Are you sure you want to leave?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: isOwner ? "Delete" : "Leave",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            if (isOwner) {
                                await fridgeApi.deleteFridge(fridge._id);
                            } else {
                                await fridgeApi.leaveFridge(fridge._id);
                            }
                            // 更新 Store
                            removeFridge(fridge._id);
                            Alert.alert("Success", isOwner ? "Fridge deleted" : "Left fridge");
                        } catch (error: any) {
                            Alert.alert("Error", error.response?.data?.message || "Action failed");
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
                                    <Text className="text-green-700 text-[10px] font-bold">CURRENT</Text>
                                </View>
                            )}
                        </View>
                        <Text className="text-gray-500 text-xs">
                            {isOwner ? "You are the Owner" : `Owner: ${item.ownerId.name}`}
                        </Text>
                    </View>
                </View>

                {/* 分割线 */}
                <View className="h-[1px] bg-gray-100 mb-3" />

                {/* 操作按钮 */}
                <View className="flex-row justify-end gap-3">
                    {/* 只有 Owner 可以邀请 */}
                    {isOwner && (
                        <TouchableOpacity
                            onPress={() => handleInvite(item._id, item.name)}
                            className="flex-row items-center bg-blue-50 px-4 py-2 rounded-lg"
                        >
                            <Ionicons name="share-social-outline" size={18} color="#2563EB" />
                            <Text className="text-blue-600 font-pbold text-xs ml-1">Invite</Text>
                        </TouchableOpacity>
                    )}

                    {/* 退出/删除 按钮 */}
                    <TouchableOpacity
                        onPress={() => handleLeaveOrDelete(item)}
                        className="flex-row items-center bg-red-50 px-4 py-2 rounded-lg"
                    >
                        <Ionicons name={isOwner ? "trash-outline" : "exit-outline"} size={18} color="#DC2626" />
                        <Text className="text-red-600 font-pbold text-xs ml-1">
                            {isOwner ? "Delete" : "Leave"}
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
                    <Text className="text-xl font-pbold text-slate-800">Manage Fridges</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <FlatList
                data={fridges}
                renderItem={renderItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24 }}
                ListEmptyComponent={
                    <Text className="text-center text-gray-400 mt-10">No fridges found.</Text>
                }
            />
        </View>
    );
}