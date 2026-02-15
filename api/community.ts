import apiClient from "./config";

export interface CommunityPost {
    _id: string;
    postedBy: {
        _id: string;
        name: string;
        email: string;
    };
    name: string;
    description: string;
    location: {
        city: string;
        district?: string;
        publicDescription: string;
        approximateCoords: {
            latitude: number;
            longitude: number;
        };
        exactAddress?: string; // Only visible if canSeeExactLocation = true
        exactCoords?: {
            latitude: number;
            longitude: number;
        };
    };
    contact: string;
    imageUrl?: string;
    status: 'available' | 'reserved' | 'taken';
    tags: string[];
    distance?: number; // Distance in km
    viewCount: number;
    reservationCount?: number;
    messageCount?: number;
    hasMessages?: boolean;
    canSeeExactLocation?: boolean;
    myReservation?: Reservation;
    createdAt: string;
}

interface CommunityQueryParams {
    city?: string;
    lat?: number;
    lng?: number;
    radius?: number;
}

export interface Reservation {
    _id: string;
    userId: {
        _id: string;
        name: string;
    };
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    message?: string;
    pickupTime?: string;
    createdAt: string;
}

export interface Message {
    _id: string;
    from: {
        _id: string;
        name: string;
    };
    message: string;
    createdAt: string;
}

export interface CreatePostData {
    name: string;
    description: string;
    contact: string;
    imageUrl?: string;
    tags?: string[];
    // Location data
    city: string;
    district?: string;
    publicLocation: string; // e.g., "Near Green Bazaar"
    exactAddress?: string;
    latitude: number;
    longitude: number;
}

export const communityApi = {
    // Get all posts with optional filters
    getAll: async (params?: CommunityQueryParams) => {
        let url = '/community?';

        // 拼接查询参数
        if (params?.city && params.city !== 'All') {
            url += `city=${params.city}&`;
        }
        if (params?.lat && params?.lng) {
            url += `lat=${params.lat}&lng=${params.lng}&radius=${params.radius || 10}&`;
        }

        const response = await apiClient.get<CommunityPost[]>(url);
        return response.data;
    },

    getOne: async (id: string) => {
        const response = await apiClient.get<CommunityPost>(`/community/${id}`);
        return response.data;
    },

    create: async (data: CreatePostData) => {
        const response = await apiClient.post<CommunityPost>("/community", data);
        return response.data;
    },

    updateStatus: async (id: string, status: 'available' | 'reserved' | 'taken') => {
        const response = await apiClient.put<CommunityPost>(`/community/${id}/status`, { status });
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete(`/community/${id}`);
        return response.data;
    },

    // 🆕 Reservation methods
    createReservation: async (id: string, message?: string, pickupTime?: Date) => {
        const response = await apiClient.post<CommunityPost>(`/community/${id}/reserve`, {
            message,
            pickupTime
        });
        return response.data;
    },

    updateReservation: async (
        postId: string,
        reservationId: string,
        status: 'confirmed' | 'cancelled' | 'completed'
    ) => {
        const response = await apiClient.put<CommunityPost>(
            `/community/${postId}/reservation/${reservationId}`,
            { status }
        );
        return response.data;
    },

    // 🆕 Messaging methods
    sendMessage: async (id: string, message: string) => {
        const response = await apiClient.post<{ messages: Message[] }>(
            `/community/${id}/message`,
            { message }
        );
        return response.data;
    },

    getMessages: async (id: string) => {
        const response = await apiClient.get<{ messages: Message[] }>(
            `/community/${id}/messages`
        );
        return response.data;
    }
};