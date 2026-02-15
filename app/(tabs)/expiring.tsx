import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, FridgeItem } from "../../api/food";
import { recipeApi, Recipe } from "../../api/recipe"; // 🆕 引入 Recipe API
import { RecipeModal } from "../../components/RecipeModal"; // 🆕 引入 Modal
import { useFridgeStore } from "../../store/fridgeStore";
import { ExpiringItemCard } from "../../components/ExpiringItemCard";
import { useUserStore } from "@/store/userStore";

export default function Expiring() {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore();

    // Data State
    const [expiringItems, setExpiringItems] = useState<FridgeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Selection State
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    // AI Recipe State
    const [generating, setGenerating] = useState(false);
    const [recipeModalVisible, setRecipeModalVisible] = useState(false);
    const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);

    const { userInfo } = useUserStore();

    useEffect(() => {
        if (selectedFridge) {
            fetchData();
        }
    }, [selectedFridge]);

    const fetchData = async () => {
        if (!selectedFridge) {
            setLoading(false);
            return;
        }

        try {
            // Get items expiring within 3 days
            const data = await foodApi.getExpiring(selectedFridge._id, 3);
            // Sort by expiry date (soonest first)
            const sorted = data.sort((a, b) =>
                new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
            );
            setExpiringItems(sorted);
        } catch (error: any) {
            console.error('Failed to fetch expiring items:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setSelectedItems([]);
        fetchData();
    };

    // --- Actions ---

    const handleDeleteItem = async (itemId: string, itemName: string) => {
        Alert.alert(
            "Remove Item",
            `Remove ${itemName} from your fridge?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await foodApi.delete(itemId);
                            fetchData(); // 刷新列表
                        } catch (error) {
                            Alert.alert("Error", "Failed to delete item");
                        }
                    }
                }
            ]
        );
    };

    const handleMarkConsumed = async (itemId: string, itemName: string) => {
        Alert.alert(
            "Mark as Consumed",
            `Did you consume ${itemName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Consumed",
                    onPress: async () => {
                        try {
                            await foodApi.delete(itemId);
                            Alert.alert("Great Job! 🎉", "You prevented food waste!");
                            fetchData();
                        } catch (error) {
                            Alert.alert("Error", "Failed to update item");
                        }
                    }
                }
            ]
        );
    };

    const toggleItemSelection = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    // 🍳 Generate Recipe Logic
    const handleGenerateRecipe = async () => {
        if (selectedItems.length === 0) {
            Alert.alert("No Items Selected", "Please select items to generate a recipe.");
            return;
        }

        // Get names of selected items
        const selectedItemsData = expiringItems.filter(item => selectedItems.includes(item._id));
        const ingredientNames = selectedItemsData.map(item => item.name);

        setGenerating(true);

        try {
            // Call AI API
            const data = await recipeApi.generate(
                ingredientNames,
                userInfo?.dietaryPreferences || [] // 传给后端
            );
            setGeneratedRecipes(data.recipes);
            setRecipeModalVisible(true);
        } catch (error) {
            Alert.alert("Error", "Chef AI is busy right now. Please try again later.");
        } finally {
            setGenerating(false);
        }
    };

    // Group items by urgency
    const expiredItems = expiringItems.filter(item => item.status === 'expired');

    const expiringToday = expiringItems.filter(item => {
        const now = new Date();
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft === 0 && item.status !== 'expired';
    });

    const expiringSoon = expiringItems.filter(item => {
        const now = new Date();
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && item.status === 'expiring';
    });

    if (loading) {
        return (
            <View className="flex-1 bg-white items-center justify-center">
                <ActivityIndicator size="large" color="#F97316" />
                <Text className="text-gray-500 mt-4 font-pmedium">Checking expiring items...</Text>
            </View>
        );
    }

    if (!selectedFridge) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center p-6">
                <Text className="text-gray-500 text-lg">Please select a fridge first.</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-orange-500 pt-16 pb-6 px-6 rounded-b-[30px] shadow-sm z-10">
                <View className="flex-row items-center justify-between mb-2">
                    <View>
                        <Text className="text-white text-2xl font-pbold">Expiring Soon</Text>
                        <Text className="text-white/80 text-sm font-pmedium mt-1">
                            {expiringItems.length} items need attention
                        </Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => router.push("/(tabs)/fridge")}
                        className="bg-white/20 p-3 rounded-full"
                    >
                        <MaterialCommunityIcons name="fridge" size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Stats */}
                {expiringItems.length > 0 && (
                    <View className="flex-row gap-3 mt-4">
                        <View className="bg-red-500/30 backdrop-blur-md px-3 py-2 rounded-xl flex-1 items-center">
                            <Text className="text-white text-xs font-pmedium">Expired</Text>
                            <Text className="text-white text-lg font-pbold">{expiredItems.length}</Text>
                        </View>
                        <View className="bg-white/30 backdrop-blur-md px-3 py-2 rounded-xl flex-1 items-center">
                            <Text className="text-white text-xs font-pmedium">Today</Text>
                            <Text className="text-white text-lg font-pbold">{expiringToday.length}</Text>
                        </View>
                        <View className="bg-white/30 backdrop-blur-md px-3 py-2 rounded-xl flex-1 items-center">
                            <Text className="text-white text-xs font-pmedium">Soon</Text>
                            <Text className="text-white text-lg font-pbold">{expiringSoon.length}</Text>
                        </View>
                    </View>
                )}
            </View>

            {/* Content */}
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 120 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F97316" />
                }
            >
                {/* Empty State */}
                {expiringItems.length === 0 && (
                    <View className="items-center px-6 mt-12">
                        <View className="w-32 h-32 bg-green-100 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="check-circle" size={64} color="#22C55E" />
                        </View>
                        <Text className="text-xl font-pbold text-gray-800 mb-2">All Good!</Text>
                        <Text className="text-gray-500 text-center mb-6">
                            No items are expiring soon. Keep up the great work! 🎉
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/(tabs)/fridge")}
                            className="bg-primary px-6 py-3 rounded-xl"
                        >
                            <Text className="text-white font-pbold">View All Items</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action Bar (when items selected) */}
                {selectedItems.length > 0 && (
                    <View className="mx-6 mt-4 bg-gray-800 p-4 rounded-2xl flex-row items-center justify-between shadow-lg">
                        <Text className="text-white font-pbold">{selectedItems.length} selected</Text>
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => setSelectedItems([])}
                                className="bg-white/20 px-4 py-2 rounded-xl"
                            >
                                <Text className="text-white font-pbold text-sm">Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleGenerateRecipe}
                                className="bg-amber-500 px-4 py-2 rounded-xl flex-row items-center"
                            >
                                <MaterialCommunityIcons name="chef-hat" size={16} color="white" />
                                <Text className="text-white font-pbold text-sm ml-1">Recipe</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* --- List Sections --- */}

                {/* 1. Expired */}
                {expiredItems.length > 0 && (
                    <View className="px-6 mt-6">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="close-circle" size={20} color="#DC2626" />
                            <Text className="text-lg font-pbold text-gray-800 ml-2">Expired</Text>
                        </View>
                        <View className="space-y-3">
                            {expiredItems.map(item => (
                                <ExpiringItemCard
                                    key={item._id}
                                    item={item}
                                    selected={selectedItems.includes(item._id)}
                                    onSelect={() => toggleItemSelection(item._id)}
                                    onConsume={() => handleMarkConsumed(item._id, item.name)}
                                    onDelete={() => handleDeleteItem(item._id, item.name)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* 2. Today */}
                {expiringToday.length > 0 && (
                    <View className="px-6 mt-6">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="alert-circle" size={20} color="#F97316" />
                            <Text className="text-lg font-pbold text-gray-800 ml-2">Expires Today</Text>
                        </View>
                        <View className="space-y-3">
                            {expiringToday.map(item => (
                                <ExpiringItemCard
                                    key={item._id}
                                    item={item}
                                    selected={selectedItems.includes(item._id)}
                                    onSelect={() => toggleItemSelection(item._id)}
                                    onConsume={() => handleMarkConsumed(item._id, item.name)}
                                    onDelete={() => handleDeleteItem(item._id, item.name)}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {/* 3. Soon */}
                {expiringSoon.length > 0 && (
                    <View className="px-6 mt-6">
                        <View className="flex-row items-center mb-3">
                            <Ionicons name="time" size={20} color="#F59E0B" />
                            <Text className="text-lg font-pbold text-gray-800 ml-2">Within 3 Days</Text>
                        </View>
                        <View className="space-y-3">
                            {expiringSoon.map(item => (
                                <ExpiringItemCard
                                    key={item._id}
                                    item={item}
                                    selected={selectedItems.includes(item._id)}
                                    onSelect={() => toggleItemSelection(item._id)}
                                    onConsume={() => handleMarkConsumed(item._id, item.name)}
                                    onDelete={() => handleDeleteItem(item._id, item.name)}
                                />
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Bottom Floating Action (Select All Prompt) */}
            {expiringItems.length > 0 && selectedItems.length === 0 && (
                <View className="absolute bottom-24 left-6 right-6 bg-white border border-gray-200 p-4 rounded-2xl flex-row items-center justify-between shadow-lg shadow-gray-200">
                    <View className="flex-1">
                        <Text className="text-gray-800 font-pbold">What's for dinner?</Text>
                        <Text className="text-gray-500 text-xs mt-0.5">Select items to generate recipes</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => {
                            const toSelect = expiringItems
                                .filter(item => item.status !== 'expired') // Don't cook expired food
                                .map(item => item._id);
                            setSelectedItems(toSelect);
                        }}
                        className="bg-orange-500 px-4 py-2 rounded-xl"
                    >
                        <Text className="text-white font-pbold text-sm">Select Fresh</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* 🆕 Loading Overlay for AI */}
            {generating && (
                <View className="absolute inset-0 bg-black/40 items-center justify-center z-50">
                    <View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
                        <ActivityIndicator size="large" color="#F97316" />
                        <Text className="text-gray-800 font-bold mt-4 text-xl">Chef AI is cooking...</Text>
                        <Text className="text-gray-500 text-sm mt-2 text-center">Creating recipes from your ingredients</Text>
                    </View>
                </View>
            )}

            {/* 🆕 Recipe Result Modal */}
            <RecipeModal
                visible={recipeModalVisible}
                recipes={generatedRecipes}
                onClose={() => setRecipeModalVisible(false)}
            />

        </View>
    );
}

