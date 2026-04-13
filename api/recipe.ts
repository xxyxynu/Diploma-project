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
    generate: async (ingredients: string[], dietaryPreferences?: string[], language?: string) => {
        const response = await apiClient.post<{ recipes: Recipe[] }>("/recipes/generate", {
            ingredients,
            dietaryPreferences,
            language
        });
        return response.data;
    }
};