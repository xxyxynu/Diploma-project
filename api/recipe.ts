import apiClient from "./config";

export interface Recipe {
    name: string;
    time: string;
    difficulty: string;
    calories: string;
    ingredients: string[];
    instructions: string[];
}

export const recipeApi = {
    // 🆕 增加第二个参数
    generate: async (ingredients: string[], dietaryPreferences?: string[]) => {
        const response = await apiClient.post<{ recipes: Recipe[] }>("/recipes/generate", {
            ingredients,
            dietaryPreferences
        });
        return response.data;
    }
};