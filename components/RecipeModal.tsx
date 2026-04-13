import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Recipe } from "../api/recipe";
import { cookbookApi } from "../api/cookbook";
import { useUserStore } from "../store/userStore";
import { translations } from "../i18n/translations";
import Toast from "react-native-toast-message";

interface Props {
    visible: boolean;
    onClose: () => void;
    recipes: Recipe[];
}

export const RecipeModal = ({ visible, onClose, recipes }: Props) => {
    const { language } = useUserStore();
    const t = translations[language];

    const [savedIndices, setSavedIndices] = useState<number[]>([]);

    const handleSave = async (recipe: Recipe, index: number) => {
        if (savedIndices.includes(index)) {
            Toast.show({
                type: 'info',
                text1: t.recipeSaved,
                position: 'bottom'
            });
            return;
        }

        try {
            await cookbookApi.save(recipe);
            setSavedIndices(prev => [...prev, index]);
            Toast.show({
                type: 'success',
                text1: t.recipeSaved,
                text2: t.recipeSavedMsg,
                position: 'top', // 在 Modal 上方弹出更显眼
            });
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t.detailError || "Error",
                text2: t.failedToPost || "Failed to save recipe"
            });
        }
    };

    const getDifficultyText = (diff: string) => {
        if (diff === 'Easy') return t.difficultyEasy;
        if (diff === 'Medium') return t.difficultyMedium;
        if (diff === 'Hard') return t.difficultyHard;
        return diff;
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View className="flex-1 bg-white pt-6">
                {/* Header */}
                <View className="px-6 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <Text className="text-2xl font-pbold text-slate-800">{t.chefAiTitle}</Text>
                    <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
                    <Text className="text-gray-500 mb-6 font-pmedium">
                        {t.recipeAiPrompt}
                    </Text>

                    {recipes.map((recipe, index) => {
                        const isSaved = savedIndices.includes(index);

                        return (
                            <View key={index} className="bg-white border border-gray-200 rounded-3xl p-5 mb-6 shadow-sm">
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-xl font-pbold text-amber-600 mb-1">{recipe.name}</Text>
                                        <View className={`self-start px-3 py-1 rounded-full ${recipe.difficulty === 'Easy' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                            <Text className={`text-xs font-bold ${recipe.difficulty === 'Easy' ? 'text-green-700' : 'text-orange-700'}`}>
                                                {getDifficultyText(recipe.difficulty)}
                                            </Text>
                                        </View>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => handleSave(recipe, index)}
                                        className={`p-3 rounded-full ${isSaved ? 'bg-red-50' : 'bg-gray-50'}`}
                                    >
                                        <Ionicons
                                            name={isSaved ? "heart" : "heart-outline"}
                                            size={24}
                                            color={isSaved ? "#EF4444" : "#9CA3AF"}
                                        />
                                    </TouchableOpacity>
                                </View>

                                <View className="flex-row gap-4 mb-4">
                                    <View className="flex-row items-center">
                                        <Ionicons name="time-outline" size={16} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs ml-1">{recipe.time}</Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <Ionicons name="flame-outline" size={16} color="#9CA3AF" />
                                        <Text className="text-gray-500 text-xs ml-1">{recipe.calories}</Text>
                                    </View>
                                </View>

                                <Text className="font-bold text-gray-800 mb-2">{t.ingredientsLabel}</Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {recipe.ingredients.map((ing, i) => (
                                        <View key={i} className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Text className="text-gray-600 text-xs">{ing}</Text>
                                        </View>
                                    ))}
                                </View>

                                <Text className="font-bold text-gray-800 mb-2">{t.instructionsLabel}</Text>
                                {recipe.instructions.map((step, i) => (
                                    <View key={i} className="flex-row mb-2">
                                        <Text className="text-amber-500 font-bold mr-2">{i + 1}.</Text>
                                        <Text className="text-gray-600 flex-1 text-sm leading-5">{step}</Text>
                                    </View>
                                ))}
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        </Modal>
    );
};