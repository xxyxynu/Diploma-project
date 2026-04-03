import apiClient from "./config";

// Type definitions
export interface FridgeItem {
    _id: string;
    fridgeId: string;
    name: string;
    barcode?: string;
    brand?: string;
    imageUrl?: string;
    productionDate?: Date;
    purchaseDate: Date;
    expiryDate: Date;
    quantity: number;
    unit: string;
    price: number;
    category: 'Dairy' | 'Fruit' | 'Vegetables' | 'Meat' | 'Beverages' | 'Snacks' | 'Other';
    status: 'fresh' | 'expiring' | 'expired';
    notes?: string;
    addedBy?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ProductInfo {
    barcode: string;
    name: string;
    brand: string;
    imageUrl: string;
    category: string;
    suggestedCategory: string;
}

export interface ItemStats {
    total: number;
    fresh: number;
    expiring: number;
    expired: number;
}

export interface CreateItemData {
    fridgeId: string;
    name: string;
    barcode?: string;
    brand?: string;
    imageUrl?: string;
    productionDate?: Date;
    expiryDate: Date;
    quantity?: number;
    unit?: string;
    price?: number;
    category?: string;
    notes?: string;
}

export const foodApi = {
    // Get all items (requires fridgeId)
    getAll: async (fridgeId: string) => {
        const response = await apiClient.get<FridgeItem[]>(`/items?fridgeId=${fridgeId}`);
        return response.data;
    },

    // Get items grouped by category (requires fridgeId)
    getByCategory: async (fridgeId: string) => {
        const response = await apiClient.get<Record<string, FridgeItem[]>>(`/items/by-category?fridgeId=${fridgeId}`);
        return response.data;
    },

    // Get expiring items (requires fridgeId)
    getExpiring: async (fridgeId: string, days: number = 3) => {
        const response = await apiClient.get<FridgeItem[]>(`/items/expiring?fridgeId=${fridgeId}&days=${days}`);
        return response.data;
    },

    // Get statistics (requires fridgeId)
    getStats: async (fridgeId: string) => {
        const response = await apiClient.get<ItemStats>(`/items/stats?fridgeId=${fridgeId}`);
        return response.data;
    },

    // Get single item
    getOne: async (id: string) => {
        const response = await apiClient.get<FridgeItem>(`/items/${id}`);
        return response.data;
    },

    // 🆕 Lookup product by barcode
    lookupBarcode: async (barcode: string) => {
        const response = await apiClient.get<ProductInfo>(`/items/barcode/${barcode}`);
        return response.data;
    },

    // Create item
    create: async (data: CreateItemData) => {
        const response = await apiClient.post<FridgeItem>("/items", data);
        return response.data;
    },

    // Update item
    update: async (id: string, data: Partial<CreateItemData>) => {
        const response = await apiClient.put<FridgeItem>(`/items/${id}`, data);
        return response.data;
    },

    // Delete item
    delete: async (id: string) => {
        const response = await apiClient.delete(`/items/${id}`);
        return response.data;
    },

    consume: async (id: string) => {
        const response = await apiClient.post<{ ecoPoints: number }>(`/items/${id}/consume`);
        return response.data;
    },

    waste: async (id: string) => {
        const response = await apiClient.post(`/items/${id}/waste`);
        return response.data;
    }
};