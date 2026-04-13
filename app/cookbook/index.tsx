import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { cookbookApi, SavedRecipe } from "../../api/cookbook";
import { translations } from "../../i18n/translations";
import { useUserStore } from "../../store/userStore";
import Toast from "react-native-toast-message";

export default function CookBook() {
    const router = useRouter();
    const { language } = useUserStore();
    const t = translations[language];

    const [recipes, setRecipes] = useState<SavedRecipe[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
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
        Alert.alert(t.removeRecipe, t.removeRecipeConfirm, [
            { text: t.cancel, style: "cancel" },
            {
                text: t.delete,
                style: "destructive",
                onPress: async () => {
                    const original = [...recipes];
                    setRecipes(prev => prev.filter(r => r._id !== id));
                    try {
                        await cookbookApi.delete(id);
                        Toast.show({
                            type: 'success',
                            text1: t.recipeDeleted,
                        });
                    } catch (e) {
                        setRecipes(original);
                        Toast.show({
                            type: 'error',
                            text1: t.detailError,
                            text2: t.couldNotDelete
                        });
                    }
                }
            }
        ]);
    };

    const getDifficultyStyle = (diff: string) => {
        const label = t.difficulty[diff as keyof typeof t.difficulty] ?? diff;
        switch (diff) {
            case "Easy": return { bg: "bg-green-100", text: "text-green-700", label };
            case "Medium": return { bg: "bg-orange-100", text: "text-orange-700", label };
            case "Hard": return { bg: "bg-red-100", text: "text-red-700", label };
            default: return { bg: "bg-gray-100", text: "text-gray-600", label };
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
            {/* Header */}
            <View className="bg-amber-500 pt-16 pb-6 px-6 rounded-b-[35px] shadow-sm z-10 flex-row items-center justify-between">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="bg-white/20 p-2 rounded-full"
                >
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                <View className="items-center">
                    <Text className="text-white text-2xl font-pbold">{t.myCookbook}</Text>
                    <Text className="text-amber-100 text-xs font-medium">
                        {t.savedCount(recipes.length)}
                    </Text>
                </View>

                <View style={{ width: 40 }} />
            </View>

            <FlatList
                data={recipes}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchRecipes(); }}
                        tintColor="#F59E0B"
                    />
                }

                ListEmptyComponent={
                    <View className="items-center mt-20 opacity-60">
                        <MaterialCommunityIcons name="chef-hat" size={80} color="#CBD5E1" />
                        <Text className="text-gray-400 mt-6 font-pbold text-xl">
                            {t.cookbookQuiet}
                        </Text>
                        <Text className="text-gray-400 text-sm mt-2 text-center w-72">
                            {t.cookbookHint}
                        </Text>
                    </View>
                }

                renderItem={({ item }) => {
                    const isExpanded = expandedId === item._id;
                    const diff = getDifficultyStyle(item.difficulty);

                    return (
                        <View className="bg-white rounded-[24px] mb-5 shadow-sm border border-gray-100 overflow-hidden">

                            {/* Card Header — tap to expand */}
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
                                            <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                                <Text className="text-xs text-slate-600 font-bold ml-1">{item.time}</Text>
                                            </View>

                                            <View className="flex-row items-center bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Ionicons name="flame-outline" size={12} color="#F97316" />
                                                <Text className="text-xs text-slate-600 font-bold ml-1">{item.calories}</Text>
                                            </View>

                                            <View className={`px-2 py-1 rounded-md ${diff.bg}`}>
                                                <Text className={`text-xs font-bold ${diff.text}`}>
                                                    {diff.label}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View className={`w-8 h-8 rounded-full items-center justify-center ${isExpanded ? "bg-amber-100" : "bg-gray-50"}`}>
                                        <Ionicons
                                            name={isExpanded ? "chevron-up" : "chevron-down"}
                                            size={18}
                                            color={isExpanded ? "#D97706" : "#9CA3AF"}
                                        />
                                    </View>
                                </View>
                            </TouchableOpacity>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <View className="border-t border-gray-100 bg-slate-50/50">

                                    {/* Ingredients */}
                                    <View className="p-5 pb-2">
                                        <View className="flex-row items-center mb-3">
                                            <MaterialCommunityIcons name="basket-outline" size={18} color="#D97706" />
                                            <Text className="font-pbold text-sm text-slate-700 ml-2 uppercase tracking-wide">
                                                {t.ingredients}
                                            </Text>
                                        </View>
                                        <View className="flex-row flex-wrap gap-2">
                                            {item.ingredients.map((ing, i) => (
                                                <View key={i} className="bg-white px-3 py-2 rounded-xl border border-gray-100">
                                                    <Text className="text-slate-600 text-sm font-medium">{ing}</Text>
                                                </View>
                                            ))}
                                        </View>
                                    </View>

                                    {/* Instructions */}
                                    <View className="p-5 pt-2">
                                        <View className="flex-row items-center mb-3 mt-4">
                                            <MaterialCommunityIcons name="chef-hat" size={18} color="#D97706" />
                                            <Text className="font-pbold text-sm text-slate-700 ml-2 uppercase tracking-wide">
                                                {t.instructions}
                                            </Text>
                                        </View>

                                        {item.instructions.map((step, i) => (
                                            <View key={i} className="flex-row mb-4">
                                                <View className="w-6 h-6 rounded-full items-center justify-center mr-3 mt-0.5">
                                                    <Text className="text-amber-700 font-bold text-xs">{i + 1}</Text>
                                                </View>
                                                <Text className="text-slate-600 flex-1 text-sm leading-6 font-pregular">
                                                    {step}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>

                                    {/* Footer — Delete */}
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
