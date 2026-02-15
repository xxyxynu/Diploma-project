import apiClient from "./config";

export interface FridgeMember {
    userId: {
        _id: string;
        name: string;
        email: string;
    };
    role: 'owner' | 'member';
    joinedAt: Date;
}

export interface Fridge {
    _id: string;
    name: string;
    ownerId: {
        _id: string;
        name: string;
        email: string;
    };
    members: FridgeMember[];
    inviteCode?: string;
    settings: {
        allowMembersToDelete: boolean;
        notifyOnExpiry: boolean;
    };
    emoji: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateFridgeData {
    name: string;
    emoji?: string;
}

export interface UpdateFridgeData {
    name?: string;
    emoji?: string;
    settings?: {
        allowMembersToDelete?: boolean;
        notifyOnExpiry?: boolean;
    };
}

export const fridgeApi = {
    // Get all fridges user is a member of
    getAllFridges: async () => {
        const response = await apiClient.get<Fridge[]>("/fridges");
        return response.data;
    },

    // Get single fridge details
    getFridge: async (fridgeId: string) => {
        const response = await apiClient.get<Fridge>(`/fridges/${fridgeId}`);
        return response.data;
    },

    // Create new fridge
    createFridge: async (data: CreateFridgeData) => {
        const response = await apiClient.post<Fridge>("/fridges", data);
        return response.data;
    },

    // Update fridge
    updateFridge: async (fridgeId: string, data: UpdateFridgeData) => {
        const response = await apiClient.put<Fridge>(`/fridges/${fridgeId}`, data);
        return response.data;
    },

    // Delete fridge
    deleteFridge: async (fridgeId: string) => {
        const response = await apiClient.delete(`/fridges/${fridgeId}`);
        return response.data;
    },

    // Generate new invite code
    generateInviteCode: async (fridgeId: string) => {
        const response = await apiClient.post<{ inviteCode: string; message: string }>(
            `/fridges/${fridgeId}/invite`
        );
        return response.data;
    },

    // Join fridge via invite code
    joinFridge: async (inviteCode: string) => {
        const response = await apiClient.post<{ message: string; fridge: Fridge }>(
            "/fridges/join",
            { inviteCode }
        );
        return response.data;
    },

    // Leave fridge
    leaveFridge: async (fridgeId: string) => {
        const response = await apiClient.post(`/fridges/${fridgeId}/leave`);
        return response.data;
    },

    // Remove member (owner only)
    removeMember: async (fridgeId: string, memberId: string) => {
        const response = await apiClient.delete(`/fridges/${fridgeId}/members/${memberId}`);
        return response.data;
    }
};