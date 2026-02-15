import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useFridgeStore } from "../store/fridgeStore";

interface FridgeSwitcherProps {
    visible: boolean;
    onClose: () => void;
}

export const FridgeSwitcher = ({ visible, onClose }: FridgeSwitcherProps) => {
    const router = useRouter();
    const { fridges, selectedFridge, setSelectedFridge } = useFridgeStore();

    const handleSelectFridge = (fridgeId: string) => {
        const fridge = fridges.find(f => f._id === fridgeId);
        if (fridge) {
            setSelectedFridge(fridge);
            onClose();
        }
    };

    const handleCreateFridge = () => {
        onClose();
        router.push("/fridge-management/create");
    };

    const handleJoinFridge = () => {
        onClose();
        router.push("/fridge-management/join");
    };

    // 🆕 跳转到管理页
    const handleManage = () => {
        onClose();
        router.push("/fridge-management/manage"); // 我们稍后创建这个页面
    };

    return (
        <Modal
            visible={visible}
            animationType="fade" // 改成 fade 看起来更像原生下拉
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPress={onClose}
                className="flex-1 justify-end bg-black/50"
            >
                {/* 防止点击内容区域关闭 Modal */}
                <TouchableOpacity activeOpacity={1} className="bg-white rounded-t-[30px] max-h-[80%]">

                    {/* Header */}
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-100">
                        <Text className="text-xl font-pbold text-gray-800">My Fridges</Text>

                        {/* 🆕 修改这里：把关闭按钮换成 Manage 文字，或者在旁边加一个 */}
                        <TouchableOpacity onPress={handleManage}>
                            <Text className="text-primary font-pbold text-base">Manage</Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView className="" showsVerticalScrollIndicator={false}>
                        {/* Current Fridges List */}
                        <View className="p-6">
                            {fridges.map((fridge) => {
                                const isSelected = selectedFridge?._id === fridge._id;
                                // 简单的判断 Owner 逻辑
                                const isOwner = fridge.ownerId._id === fridge.members.find(m => m.role === 'owner')?.userId._id;
                                // 注意：后端返回结构如果 ownerId 是对象，上面逻辑可能需要调整，这里仅作 UI 展示参考
                                const memberCount = fridge.members.length;

                                return (
                                    <TouchableOpacity
                                        key={fridge._id}
                                        onPress={() => handleSelectFridge(fridge._id)}
                                        className={`mb-3 p-4 rounded-2xl border ${isSelected
                                            ? 'bg-green-50 border-green-500'
                                            : 'bg-white border-gray-100'
                                            }`}
                                    >
                                        <View className="flex-row items-center">
                                            {/* Emoji */}
                                            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${isSelected ? 'bg-white' : 'bg-gray-50'
                                                }`}>
                                                <Text className="text-2xl">{fridge.emoji}</Text>
                                            </View>

                                            {/* Info */}
                                            <View className="flex-1">
                                                <Text className={`text-base font-pbold ${isSelected ? 'text-green-800' : 'text-gray-800'
                                                    }`} numberOfLines={1}>
                                                    {fridge.name}
                                                </Text>
                                                <View className="flex-row items-center mt-1">
                                                    <Text className="text-xs text-gray-400">
                                                        {memberCount} members
                                                    </Text>
                                                </View>
                                            </View>

                                            {isSelected && (
                                                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                                            )}
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Actions */}
                        <View className="px-6 pb-10 gap-3">
                            <TouchableOpacity
                                onPress={handleCreateFridge}
                                className="flex-row items-center justify-center bg-primary py-4 rounded-2xl"
                            >
                                <Ionicons name="add-circle" size={24} color="white" />
                                <Text className="text-white font-pbold ml-2 text-lg">Create New</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleJoinFridge}
                                className="flex-row items-center justify-center bg-white border border-gray-200 py-4 rounded-2xl"
                            >
                                <MaterialCommunityIcons name="qrcode-scan" size={20} color="#64748b" />
                                <Text className="text-gray-700 font-pbold ml-2 text-lg">Join with Code</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

export const FridgeSwitcherButton = () => {
    const [visible, setVisible] = useState(false);
    const { selectedFridge, fridges } = useFridgeStore();

    if (!selectedFridge) return null;

    return (
        <>
            <TouchableOpacity
                onPress={() => setVisible(true)}
                className="flex-row items-center bg-white/20 px-3 py-2 rounded-full backdrop-blur-md border border-white/10"
            >
                <Text className="text-2xl mr-2">{selectedFridge.emoji}</Text>
                <Text className="text-white font-bold text-lg mr-1 " numberOfLines={1}>
                    {selectedFridge.name}
                </Text>
                {fridges.length > 1 && (
                    <Ionicons name="chevron-down" size={16} color="white" />
                )}
            </TouchableOpacity>

            <FridgeSwitcher visible={visible} onClose={() => setVisible(false)} />
        </>
    );
};