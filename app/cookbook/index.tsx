import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { cookbookApi, SavedRecipe } from "../../api/cookbook";

export default function CookBook() {
    const router = useRouter();
    const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 记录展开的 ID
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        fetchRecipes();
    }, []);

    const fetchRecipes = async () => {
        try {
            const data = await cookbookApi.getAll();
            setRecipes(data);
        } catch (error) {
            console.error("Failed to load cookbook");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleDelete = (id: string) => {
        Alert.alert("Remove Recipe", "Delete this recipe from your cookbook?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    // 乐观更新
                    const original = [...recipes];
                    setRecipes(prev => prev.filter(r => r._id !== id));
                    try {
                        await cookbookApi.delete(id);
                    } catch (e) {
                        setRecipes(original); // 失败回滚
                        Alert.alert("Error", "Could not delete");
                    }
                }
            }
        ]);
    };

    // 🎨 难度颜色辅助函数
    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case 'Easy': return 'bg-green-100 text-green-700';
            case 'Medium': return 'bg-orange-100 text-orange-700';
            case 'Hard': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header: 暖黄色系 */}
            <View className="bg-amber-500 pt-16 pb-6 px-6 rounded-b-[35px] shadow-sm z-10 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-white/20 p-2 rounded-full backdrop-blur-md"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <View className="items-center">
                    <Text className="text-white text-2xl font-pbold">My CookBook</Text>
                    <Text className="text-amber-100 text-xs font-medium">{recipes.length} Saved Recipes</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={recipes}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchRecipes(); }} tintColor="#F59E0B" />}

                ListEmptyComponent={
                    <View className="items-center mt-20 opacity-60">
                        <MaterialCommunityIcons name="chef-hat" size={80} color="#CBD5E1" />
                        <Text className="text-gray-400 mt-6 font-pbold text-xl">Kitchen is quiet...</Text>
                        <Text className="text-gray-400 text-sm mt-2 text-center w-64">
                            Go to "Expiring" items and let AI Chef generate some magic for you!
                        </Text>
                    </View>
                }

                renderItem={({ item }) => {
                    const isExpanded = expandedId === item._id;
                    const diffStyle = getDifficultyColor(item.difficulty);

                    return (
                        <View className="bg-white rounded-[24px] mb-5 shadow-sm border border-gray-100 overflow-hidden">
                            {/* Card Header (Clickable) */}
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => setExpandedId(isExpanded ? null : item._id)}
                                className="p-5"
                            >
                                <View className="flex-row justify-between items-start mb-3">
                                    <View className="flex-1 mr-4">
                                        <Text className="text-xl font-pbold text-slate-800 leading-tight mb-2">
                                            {item.name}
                                        </Text>

                                        {/* Tags Row */}
                                        <View className="flex-row flex-wrap gap-2">
                                            {/* Time */}
                                            <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                                <Text className="text-xs text-slate-600 font-bold ml-1">{item.time}</Text>
                                            </View>

                                            {/* Calories */}
                                            <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Ionicons name="flame-outline" size={12} color="#F97316" />
                                                <Text className="text-xs text-slate-600 font-bold ml-1">{item.calories}</Text>
                                            </View>

                                            {/* Difficulty */}
                                            <View className={`px-2 py-1 rounded-md ${diffStyle.split(' ')[0]}`}>
                                                <Text className={`text-xs font-bold ${diffStyle.split(' ')[1]}`}>
                                                    {item.difficulty}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Expand/Collapse Icon */}
                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? 'bg-amber-100' : 'bg-gray-50'}`}>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color={isExpanded ? "#D97706" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Expanded Content (Details) */}
                            {isExpanded && (
                                <View className="border-t border-gray-100 bg-slate-50/50">

                                    {/* Ingredients Section */}
                                    <View className="p-5 pb-2">
                                        <View className="flex-row items-center mb-3">
                                            <MaterialCommunityIcons name="basket-outline" size={18} color="#D97706" />
                                            <Text className="font-pbold text-sm text-slate-700 ml-2 uppercase tracking-wide">Ingredients</Text>
                                        </View>
                                        <View className="flex-row flex-wrap gap-2">
                                            {item.ingredients.map((ing, i) => (
                                                <View key={i} className="bg-white px-3 py-2 rounded-xl border border-gray-100">
                                                    <Text className="text-slate-600 text-sm font-medium">{ing}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Instructions Section */}
                                    <View className="p-5 pt-2">
                                        <View className="flex-row items-center mb-3 mt-4">
                                            <MaterialCommunityIcons name="chef-hat" size={18} color="#D97706" />
                                            <Text className="font-pbold text-sm text-slate-700 ml-2 uppercase tracking-wide">Instructions</Text>
                                        </View>

                                        {item.instructions.map((step, i) => (
                                            <View key={i} className="flex-row mb-4">
                                                {/* Step Number Bubble */}
                                                <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5">
                                                    <Text className="text-amber-700 font-bold text-xs">{i + 1}</Text>
                                                </View>
                                                {/* Step Text */}
                                                <Text className="text-slate-600 flex-1 text-sm leading-6 font-pregular">
                                                    {step}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Footer Actions */}
                                    <View className="px-5 pb-5 pt-2 flex-row justify-end border-t border-gray-100 bg-white">
                                        <TouchableOpacity
                                            onPress={() => handleDelete(item._id)}
                                            className="flex-row items-center bg-red-50 px-2 py-2 rounded-full border border-red-100"
                                        >
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>
                    );
                }}
            />
        </View>
    );
}