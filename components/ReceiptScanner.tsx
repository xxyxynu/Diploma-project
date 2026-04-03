import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, ScannedItem } from "../api/food";
import { useFridgeStore } from "../store/fridgeStore";

export const useReceiptScanner = () => {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore();

    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [receiptItems, setReceiptItems] = useState<ScannedItem[]>([]);

    // 1. 触发拍照或选图
    const startScanning = async (source: 'camera' | 'gallery' = 'camera') => {
        if (!selectedFridge) {
            Alert.alert("Error", "Please select a fridge first.");
            return;
        }

        try {
            let result;
            const options: ImagePicker.ImagePickerOptions = {
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.1,
                allowsEditing: true,
                aspect: [3, 4], // 小票通常是长条形
                base64: true,
            };

            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Permission Denied", "Camera access is required.");
                    return;
                }
                result = await ImagePicker.launchCameraAsync(options);
            } else {
                const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert("Permission Denied", "Gallery access is required.");
                    return;
                }
                result = await ImagePicker.launchImageLibraryAsync(options);
            }

            if (!result.canceled && result.assets[0].base64) {
                processReceipt(`data:image/jpeg;base64,${result.assets[0].base64}`);
            }
        } catch (error) {
            Alert.alert("Error", "Failed to open camera/gallery");
        }
    };

    // 2. 调用后端 API 处理图片
    const processReceipt = async (base64Img: string) => {
        setLoading(true);
        try {
            const data = await foodApi.scanReceipt(base64Img);
            // 默认勾选所有识别出来的物品
            const itemsWithSelection = data.items.map(i => ({ ...i, selected: true }));
            setReceiptItems(itemsWithSelection);
            setShowModal(true); // 打开确认弹窗
        } catch (error: any) {
            Alert.alert(
                "Scanning Failed",
                error.response?.data?.message || "Could not read the receipt clearly. Please try again with better lighting."
            );
        } finally {
            setLoading(false);
        }
    };

    // 3. 批量保存到冰箱
    const handleSave = async () => {
        const itemsToSave = receiptItems.filter(i => i.selected);
        if (itemsToSave.length === 0) {
            Alert.alert("No Items", "Select at least one item to save.");
            return;
        }

        setLoading(true);
        try {
            // 默认过期时间 (7天后)
            const defaultExpiry = new Date();
            defaultExpiry.setDate(defaultExpiry.getDate() + 7);

            const payload = itemsToSave.map(item => ({
                fridgeId: selectedFridge!._id,
                name: item.name,
                quantity: item.quantity || 1,
                unit: item.unit || 'piece',
                category: item.category || 'Other',
                price: item.price || 0,
                expiryDate: defaultExpiry,
                status: 'fresh'
            }));

            await foodApi.batchCreate(payload as any);

            setShowModal(false);
            Alert.alert("Success! 🎉", `${itemsToSave.length} items added to your fridge.`);
        } catch (error) {
            Alert.alert("Error", "Failed to save items to fridge.");
        } finally {
            setLoading(false);
        }
    };

    const toggleItem = (index: number) => {
        const newItems = [...receiptItems];
        newItems[index].selected = !newItems[index].selected;
        setReceiptItems(newItems);
    };

    // 4. 返回 Modal 组件
    const ReceiptModal = () => (
        <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
            <View className="flex-1 bg-gray-50">
                {/* Header */}
                <View className="bg-primary pt-14 pb-4 px-6 border-b border-primary-dark flex-row justify-between items-center shadow-sm">
                    <TouchableOpacity onPress={() => setShowModal(false)} className="bg-white/20 p-2 rounded-full">
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-pbold">Review Receipt</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* List */}
                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 40 }}>
                    <View className="bg-green-50 p-4 rounded-xl border border-green-100 mb-6 flex-row items-start">
                        <MaterialCommunityIcons name="magic-staff" size={20} color="#16A34A" />
                        <Text className="text-green-800 font-pmedium ml-2 flex-1 text-sm leading-5">
                            AI found these items. Uncheck what you don't want to add, or edit them later in the fridge.
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
                                    {item.category} • {item.quantity} {item.unit}
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
                <View className="p-6 bg-white border-t border-gray-100 pb-10">
                    <TouchableOpacity
                        onPress={handleSave}
                        disabled={loading}
                        className={`py-4 rounded-full flex-row items-center justify-center shadow-lg ${loading ? 'bg-gray-400' : 'bg-primary shadow-green-200'
                            }`}
                    >
                        {loading ? <ActivityIndicator color="white" /> : (
                            <>
                                <MaterialCommunityIcons name="fridge-outline" size={20} color="white" />
                                <Text className="text-white font-pbold text-lg ml-2">
                                    Add {receiptItems.filter(i => i.selected).length} Items
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return {
        startScanning,
        isScanning: loading,
        ReceiptModal
    };
};