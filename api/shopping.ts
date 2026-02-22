import apiClient from "./config";

export interface ShoppingItem {
    _id: string;
    fridgeId: string;
    text: string;
    isCompleted: boolean;
    addedBy?: string;
    // 🆕 Duplicate detection
    similarInFridge?: Array<{
        itemId: string;
        name: string;
        quantity: number;
        unit: string;
        expiryDate: string;
    }>;
    ignoreDuplicate: boolean;
    createdAt: string;
    updatedAt: string;
}

export const shoppingApi = {
    getAll: async (fridgeId: string) => {
        const response = await apiClient.get<ShoppingItem[]>(`/shopping?fridgeId=${fridgeId}`);
        return response.data;
    },

    create: async (fridgeId: string, text: string) => {
        const response = await apiClient.post<ShoppingItem>("/shopping", {
            fridgeId,
            text
        });
        return response.data;
    },

    toggle: async (id: string) => {
        const response = await apiClient.put<ShoppingItem>(`/shopping/${id}/toggle`);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete<{ id: string }>(`/shopping/${id}`);
        return response.data;
    },

    // 🆕 Ignore duplicate warning
    ignoreDuplicate: async (id: string) => {
        const response = await apiClient.put<ShoppingItem>(`/shopping/${id}/ignore-duplicate`);
        return response.data;
    },

    // 🆕 一键入库
    moveToFridge: async (fridgeId: string) => {
        const response = await apiClient.post<{ message: string, movedCount: number }>("/shopping/move-to-fridge", {
            fridgeId
        });
        return response.data;
    }
};