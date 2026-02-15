import apiClient from "./config";
import { Recipe } from "./recipe"; // 复用之前的 Recipe 接口

// 继承 Recipe 接口，并增加 _id
export interface SavedRecipe extends Recipe {
    _id: string;
    createdAt: string;
}

export const cookbookApi = {
    getAll: async () => {
        const response = await apiClient.get<SavedRecipe[]>("/cookbook");
        return response.data;
    },

    save: async (recipe: Recipe) => {
        const response = await apiClient.post<SavedRecipe>("/cookbook", recipe);
        return response.data;
    },

    delete: async (id: string) => {
        await apiClient.delete(`/cookbook/${id}`);
    }
};