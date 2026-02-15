import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

    useEffect(() => {
        if (selectedFridge) {
            fetchItems();
        }
    }, [selectedFridge]);

    const fetchItems = async () => {
        if (!selectedFridge) return;

        try {
            const data = await shoppingApi.getAll(selectedFridge._id);
            setItems(data);
        } catch (error) {
            console.error("Failed to load shopping list:", error);
            Alert.alert("Error", "Failed to load shopping list");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAdd = async () => {
        if (!newItemText.trim() || !selectedFridge) return;

        setAdding(true);
        try {
            const newItem = await shoppingApi.create(selectedFridge._id, newItemText.trim());

            // 🆕 Check if duplicate detected
            if (newItem.similarInFridge && newItem.similarInFridge.length > 0 && !newItem.ignoreDuplicate) {
                // Show warning but keep item in list
                const duplicateNames = newItem.similarInFridge.map(i => i.name).join(", ");
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
                            onPress: async () => {
                                await shoppingApi.ignoreDuplicate(newItem._id);
                                fetchItems();
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
        try {
            await shoppingApi.toggle(item._id);
            setItems(items.map(i =>
                i._id === item._id ? { ...i, isCompleted: !i.isCompleted } : i
            ));
        } catch (error) {
            Alert.alert("Error", "Failed to update item");
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await shoppingApi.delete(id);
            setItems(items.filter(i => i._id !== id));
        } catch (error) {
            Alert.alert("Error", "Failed to delete item");
        }
    };

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

    const pendingItems = items.filter(i => !i.isCompleted);
    const completedItems = items.filter(i => i.isCompleted);
    const itemsWithDuplicates = pendingItems.filter(
        i => i.similarInFridge && i.similarInFridge.length > 0 && !i.ignoreDuplicate
    );

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
                <Text className="text-gray-500 text-center mt-2">Select a fridge to create shopping list</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-blue-500 pt-16 pb-6 px-6 rounded-b-[30px]">
                <View className="flex-row items-center justify-between mb-4">
                    <View>
                        <Text className="text-white text-2xl font-pbold">Shopping List</Text>
                        <Text className="text-blue-100 text-sm font-pmedium mt-1">
                            {pendingItems.length} items to buy
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

                {/* 🆕 Duplicate Warning Banner */}
                {itemsWithDuplicates.length > 0 && (
                    <View className="bg-amber-500/20 border border-amber-300/30 p-3 rounded-xl flex-row items-center">
                        <Ionicons name="warning" size={20} color="#FCD34D" />
                        <Text className="text-amber-50 text-xs ml-2 flex-1">
                            {itemsWithDuplicates.length} {itemsWithDuplicates.length === 1 ? 'item is' : 'items are'} already in your fridge
                        </Text>
                    </View>
                )}

                {/* Add Item Input */}
                <View className="bg-white/20 backdrop-blur-md rounded-2xl px-4 py-3 flex-row items-center mt-3">
                    <Ionicons name="add-circle-outline" size={24} color="white" />
                    <TextInput
                        className="flex-1 ml-3 text-white font-pregular"
                        placeholder="Add item..."
                        placeholderTextColor="rgba(255,255,255,0.6)"
                        value={newItemText}
                        onChangeText={setNewItemText}
                        onSubmitEditing={handleAdd}
                        returnKeyType="done"
                    />
                    {adding ? (
                        <ActivityIndicator color="white" size="small" />
                    ) : newItemText.trim().length > 0 ? (
                        <TouchableOpacity onPress={handleAdd}>
                            <Ionicons name="checkmark-circle" size={28} color="white" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Items List */}
            <FlatList
                data={[...pendingItems, ...completedItems]}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchItems(); }} tintColor="#3B82F6" />
                }
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <MaterialCommunityIcons name="cart-outline" size={80} color="#e5e7eb" />
                        <Text className="text-gray-400 mt-4 font-pmedium">Your shopping list is empty</Text>
                        <Text className="text-gray-400 text-sm mt-2">Add items above to get started</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <ShoppingItemCard
                        item={item}
                        onToggle={() => handleToggle(item)}
                        onDelete={() => handleDelete(item._id)}
                        onIgnoreDuplicate={async () => {
                            await shoppingApi.ignoreDuplicate(item._id);
                            fetchItems();
                        }}
                    />
                )}
            />
        </View>
    );
}

// 🆕 Shopping Item Card with Duplicate Warning
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
            <View className={`bg-white rounded-2xl p-4 border ${hasDuplicates ? 'border-amber-200 bg-amber-50/30' : 'border-gray-100'
                } ${item.isCompleted ? 'opacity-60' : ''}`}>
                <View className="flex-row items-center">
                    {/* Checkbox */}
                    <TouchableOpacity
                        onPress={onToggle}
                        className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${item.isCompleted
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                            }`}
                    >
                        {item.isCompleted && <Ionicons name="checkmark" size={16} color="white" />}
                    </TouchableOpacity>

                    {/* Item Text */}
                    <Text className={`flex-1 font-pregular ${item.isCompleted
                        ? 'text-gray-400 line-through'
                        : 'text-gray-800'
                        }`}>
                        {item.text}
                    </Text>

                    {/* 🆕 Duplicate Warning Icon */}
                    {hasDuplicates && !item.isCompleted && (
                        <View className="bg-amber-100 p-1.5 rounded-full mr-2">
                            <Ionicons name="warning" size={16} color="#F59E0B" />
                        </View>
                    )}

                    {/* Delete Button */}
                    <TouchableOpacity onPress={onDelete} className="p-2">
                        <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                {/* 🆕 Duplicate Details */}
                {hasDuplicates && !item.isCompleted && (
                    <View className="mt-3 pt-3 border-t border-amber-200">
                        <Text className="text-amber-800 font-pbold text-xs mb-2">
                            ⚠️ Already in Fridge:
                        </Text>
                        {item.similarInFridge!.map((fridgeItem, index) => (
                            <View key={index} className="flex-row items-center justify-between mb-1">
                                <Text className="text-amber-700 text-xs">
                                    • {fridgeItem.name} ({fridgeItem.quantity} {fridgeItem.unit})
                                </Text>
                                <Text className="text-amber-600 text-[10px]">
                                    Exp: {new Date(fridgeItem.expiryDate).toLocaleDateString()}
                                </Text>
                            </View>
                        ))}
                        <TouchableOpacity
                            onPress={onIgnoreDuplicate}
                            className="mt-2 self-start"
                        >
                            <Text className="text-amber-600 text-xs font-pbold underline">
                                Keep anyway
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};