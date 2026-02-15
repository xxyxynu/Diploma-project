import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Recipe } from "../api/recipe";
import { cookbookApi } from "../api/cookbook";

interface Props {
    visible: boolean;
    onClose: () => void;
    recipes: Recipe[];
}

export const RecipeModal = ({ visible, onClose, recipes }: Props) => {
    // 记录哪些食谱已经被保存了 (按索引记录)
    const [savedIndices, setSavedIndices] = useState<number[]>([]);

    const handleSave = async (recipe: Recipe, index: number) => {
        if (savedIndices.includes(index)) return; // 已经保存过了

        try {
            await cookbookApi.save(recipe);
            setSavedIndices(prev => [...prev, index]);
            Alert.alert("Saved", "Recipe added to your CookBook!");
        } catch (error) {
            Alert.alert("Error", "Failed to save recipe");
        }
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View className="flex-1 bg-white pt-6">
                {/* Header */}
                <View className="px-6 pb-4 border-b border-gray-100 flex-row justify-between items-center">
                    <Text className="text-2xl font-pbold text-slate-800">Chef AI 👨‍🍳</Text>
                    <TouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 50 }}>
                    <Text className="text-gray-500 mb-6 font-pmedium">
                        Here are some recipes based on your expiring items!
                    </Text>

                    {recipes.map((recipe, index) => {
                        const isSaved = savedIndices.includes(index);

                        return (
                            <View key={index} className="bg-white border border-gray-200 rounded-3xl p-5 mb-6 shadow-sm">
                                {/* Recipe Title & Actions */}
                                <View className="flex-row justify-between items-start mb-4">
                                    <View className="flex-1 mr-2">
                                        <Text className="text-xl font-pbold text-amber-600 mb-1">{recipe.name}</Text>
                                        <View className={`self-start px-3 py-1 rounded-full ${recipe.difficulty === 'Easy' ? 'bg-green-100' : 'bg-orange-100'}`}>
                                            <Text className={`text-xs font-bold ${recipe.difficulty === 'Easy' ? 'text-green-700' : 'text-orange-700'}`}>
                                                {recipe.difficulty}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* ❤️ Save Button */}
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

                                {/* Meta Info */}
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

                                {/* Ingredients */}
                                <Text className="font-bold text-gray-800 mb-2">Ingredients:</Text>
                                <View className="flex-row flex-wrap gap-2 mb-4">
                                    {recipe.ingredients.map((ing, i) => (
                                        <View key={i} className="bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                            <Text className="text-gray-600 text-xs">{ing}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* Instructions */}
                                <Text className="font-bold text-gray-800 mb-2">Instructions:</Text>
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