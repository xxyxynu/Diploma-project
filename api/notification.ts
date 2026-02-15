import apiClient from "./config";

export interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    type: 'system' | 'expiry' | 'community' | 'message' | 'report';
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export const notificationApi = {
    getAll: async () => {
        const response = await apiClient.get<NotificationItem[]>("/notifications");
        return response.data;
    },

    markRead: async (id: string) => {
        await apiClient.put(`/notifications/${id}/read`);
    },

    markAllRead: async () => {
        await apiClient.put("/notifications/read-all");
    },

    // 🆕 删除单条
    delete: async (id: string) => {
        await apiClient.delete(`/notifications/${id}`);
    },

    // 🆕 清空所有
    deleteAll: async () => {
        await apiClient.delete("/notifications");
    }
};