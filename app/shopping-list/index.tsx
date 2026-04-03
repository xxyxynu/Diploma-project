import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useRef } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { shoppingApi, ShoppingItem } from "../../api/shopping";
import { useFridgeStore } from "../../store/fridgeStore";

export default function ShoppingList() {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore();

    const [items, setItems] = useState<ShoppingItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [newItemText, setNewItemText] = useState("");
    const [adding, setAdding] = useState(false);

    // 轮询定时器引用
    const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (selectedFridge) {
            fetchItems();

            // 开启轮询
            pollingInterval.current = setInterval(() => {
                fetchItemsSilent();
            }, 5000);
        }

        return () => {
            if (pollingInterval.current) clearInterval(pollingInterval.current);
        };
    }, [selectedFridge]);

    const fetchItems = async () => {
        if (!selectedFridge) return;
        try {
            const data = await shoppingApi.getAll(selectedFridge._id);
            setItems(data);
        } catch (error) {
            console.error("Failed to load shopping list");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchItemsSilent = async () => {
        if (!selectedFridge) return;
        try {
            const data = await shoppingApi.getAll(selectedFridge._id);
            setItems(prev => JSON.stringify(prev) !== JSON.stringify(data) ? data : prev);
        } catch (error) {
            // ignore
        }
    };

    // 👇 修改后的 handleAdd
    const handleAdd = async () => {
        if (!newItemText.trim() || !selectedFridge) return;

        setAdding(true);
        try {
            const newItem = await shoppingApi.create(selectedFridge._id, newItemText.trim());

            // 查重逻辑
            if (newItem.similarInFridge && newItem.similarInFridge.length > 0 && !newItem.ignoreDuplicate) {
                const duplicateNames = newItem.similarInFridge.map((i: any) => i.name).join(", ");
                Alert.alert(
                    "⚠️ Already in Fridge",
                    `You already have similar items: ${duplicateNames}\n\nDo you still want to buy this?`,
                    [
                        {
                            text: "Remove from List",
                            style: "destructive",
                            onPress: async () => {
                                await shoppingApi.delete(newItem._id);
                                fetchItems();
                            }
                        },
                        {
                            text: "Keep Anyway",
                            // ✅ 修改：点击 Keep 不消除警告，只关闭弹窗
                            onPress: () => {
                                // Do nothing. Warnings stay visible in UI.
                            }
                        }
                    ]
                );
            }

            setItems([newItem, ...items]);
            setNewItemText("");
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to add item");
        } finally {
            setAdding(false);
        }
    };

    const handleToggle = async (item: ShoppingItem) => {
        setItems(items.map(i =>
            i._id === item._id ? { ...i, isCompleted: !i.isCompleted } : i
        ));
        try {
            await shoppingApi.toggle(item._id);
        } catch (error) {
            fetchItems();
        }
    };

    const handleDelete = async (id: string) => {
        setItems(items.filter(i => i._id !== id));
        try {
            await shoppingApi.delete(id);
        } catch (error) {
            fetchItems();
        }
    };

    const handleFinishShopping = async () => {
        const completedCount = items.filter(i => i.isCompleted).length;
        if (completedCount === 0) return;

        Alert.alert(
            "Finish Shopping?",
            `Move ${completedCount} checked items to your Fridge inventory?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Move to Fridge",
                    onPress: async () => {
                        try {
                            await shoppingApi.moveToFridge(selectedFridge!._id);
                            Alert.alert("Success", "Items moved to fridge! 🎉");
                            fetchItems();
                        } catch (error) {
                            Alert.alert("Error", "Failed to move items.");
                        }
                    }
                }
            ]
        );
    };

    const pendingItems = items.filter(i => !i.isCompleted);
    const completedItems = items.filter(i => i.isCompleted);
    const hasCompletedItems = completedItems.length > 0;

    // 检查是否有未忽略的重复项
    const itemsWithDuplicates = pendingItems.filter(
        i => i.similarInFridge && i.similarInFridge.length > 0 && !i.ignoreDuplicate
    );

    const clearCompleted = async () => {
        const completedIds = items.filter(i => i.isCompleted).map(i => i._id);
        if (completedIds.length === 0) {
            Alert.alert("Info", "No completed items to clear");
            return;
        }
        Alert.alert(
            "Clear Completed",
            `Remove ${completedIds.length} completed items?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await Promise.all(completedIds.map(id => shoppingApi.delete(id)));
                            setItems(items.filter(i => !i.isCompleted));
                        } catch (error) {
                            Alert.alert("Error", "Failed to clear items");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#3B82F6" />
            </View>
        );
    }

    if (!selectedFridge) {
        return (
            <View className="flex-1 bg-white items-center justify-center p-6">
                <MaterialCommunityIcons name="cart-off" size={80} color="#9CA3AF" />
                <Text className="text-xl font-pbold text-gray-800 mt-4">No Fridge Selected</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-4"><Text className="text-blue-500">Go Back</Text></TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-blue-500 pt-16 pb-6 px-6 rounded-b-[30px] z-10">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-white text-2xl font-pbold">Shopping List</Text>
                        <Text className="text-blue-100 text-sm font-pmedium mt-1">
                            {selectedFridge.name} • {pendingItems.length} to buy
                        </Text>
                    </View>
                    {completedItems.length > 0 && (
                        <TouchableOpacity
                            onPress={clearCompleted}
                            className="bg-white/20 px-4 py-2 rounded-full"
                        >
                            <Text className="text-white font-pbold text-sm">Clear Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Duplicate Warning Banner */}
                {itemsWithDuplicates.length > 0 && (
                    <View className="bg-amber-500/20 border border-amber-300/30 p-3 rounded-xl flex-row items-center mb-3">
                        <Ionicons name="warning" size={20} color="#FCD34D" />
                        <Text className="text-amber-50 text-xs ml-2 flex-1 font-medium">
                            {itemsWithDuplicates.length} items are already in your fridge!
                        </Text>
                    </View>
                )}

                {/* Input */}
                <View className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 flex-row items-center">
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <TextInput
                        className="flex-1 ml-3 text-white font-pregular placeholder:text-blue-200"
                        placeholder="Add item..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={newItemText}
                        onChangeText={setNewItemText}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                    {adding ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : newItemText.trim().length > 0 ? (
                        <TouchableOpacity onPress={handleAdd}>
                            <Ionicons name="arrow-up-circle" size={28} color="white" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* List */}
            <FlatList
                data={[...pendingItems, ...completedItems]}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#3B82F6" />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20 opacity-50">
                        <MaterialCommunityIcons name="cart-outline" size={80} color="#9CA3AF" />
                        <Text className="text-gray-400 mt-4 font-pmedium">List is empty</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ShoppingItemCard
                        item={item}
                        onToggle={() => handleToggle(item)}
                        onDelete={() => handleDelete(item._id)}
                        onIgnoreDuplicate={async () => {
                            // 只有点击卡片里的按钮时，才真正消除警告
                            await shoppingApi.ignoreDuplicate(item._id);
                            fetchItems();
                        }}
                    />
                )}
            />

            {/* Finish Shopping Button */}
            {hasCompletedItems && (
                <View className="absolute bottom-10 left-6 right-6 shadow-xl shadow-green-200">
                    <TouchableOpacity
                        onPress={handleFinishShopping}
                        className="bg-green-500 py-4 rounded-2xl flex-row items-center justify-center border-b-4 border-green-600 active:border-b-0 active:mt-1"
                    >
                        <MaterialCommunityIcons name="fridge-bottom" size={24} color="white" />
                        <Text className="text-white font-pbold text-lg ml-2">Move Checked to Fridge</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

// Sub Component (No changes needed here)
interface ShoppingItemCardProps {
    item: ShoppingItem;
    onToggle: () => void;
    onDelete: () => void;
    onIgnoreDuplicate: () => void;
}

const ShoppingItemCard = ({ item, onToggle, onDelete, onIgnoreDuplicate }: ShoppingItemCardProps) => {
    const hasDuplicates = item.similarInFridge && item.similarInFridge.length > 0 && !item.ignoreDuplicate;

    return (
        <View className="mb-3">
            <View className={`bg-white rounded-2xl p-4 ${hasDuplicates ? 'border-amber-300 bg-amber-50' : 'border-gray-100'} ${item.isCompleted ? 'opacity-50 bg-gray-50' : ''}`}>
                <View className="flex-row items-center">
                    <TouchableOpacity
                        onPress={onToggle}
                        className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${item.isCompleted ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}
                    >
                        {item.isCompleted && <Ionicons name="checkmark" size={14} color="white" />}
                    </TouchableOpacity>

                    <Text className={`flex-1 font-pmedium text-base ${item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {item.text}
                    </Text>

                    {hasDuplicates && !item.isCompleted && (
                        <View className="bg-amber-100 p-1.5 rounded-full mr-2">
                            <Ionicons name="warning" size={16} color="#F59E0B" />
                        </View>
                    )}

                    <TouchableOpacity onPress={onDelete} className="p-2">
                        <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* Duplicate Details Expansion */}
                {hasDuplicates && !item.isCompleted && (
                    <View className="mt-3 pt-3 border-t border-amber-200">
                        <Text className="text-amber-800 font-bold text-xs mb-2">⚠️ Already in Fridge:</Text>
                        {item.similarInFridge!.map((fridgeItem: any, index: number) => (
                            <View key={index} className="flex-row items-center justify-between mb-1">
                                <Text className="text-amber-700 text-xs">• {fridgeItem.name} ({fridgeItem.quantity} {fridgeItem.unit})</Text>
                                <Text className="text-amber-600 text-[10px]">Exp: {new Date(fridgeItem.expiryDate).toLocaleDateString()}</Text>
                            </View>
                        ))}
                        <TouchableOpacity onPress={onIgnoreDuplicate} className="mt-2 self-start">
                            <Text className="text-amber-600 text-xs font-bold underline">I still want to buy it</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};