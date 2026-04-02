import { UserInfo } from "@/store/userStore";
import apiClient from "./config";

// 1. 定义请求参数类型
interface LoginParams {
    email: string;
    password: string;
}

interface RegisterParams {
    name: string; // 后端要求必填 name
    email: string;
    password: string;
}

// 2. 定义后端返回的数据结构 (根据你的 Controller)
interface AuthResponse {
    _id: string;   // 注意：Mongo 返回的是 _id
    name: string;
    email: string;
    token: string; // 我们最需要这个
}

export interface LeaderboardData {
    city: string;
    topUsers: { _id: string, name: string, ecoPoints: number }[];
    myRank: number | string;
    topPercentage: number;
}

export const authApi = {
    // 注册接口
    // 假设路由是 POST /api/users/register (请根据你的 routes 文件确认)
    register: async (data: RegisterParams) => {
        const response = await apiClient.post<AuthResponse>("/auth/signup", data);
        return response.data;
    },

    // 登录接口
    // 假设路由是 POST /api/users/login
    login: async (data: LoginParams) => {
        const response = await apiClient.post<AuthResponse>("/auth/login", data);
        return response.data;
    },

    getMe: async () => {
        // 确保这里返回的数据包含 pushToken，以便我们知道开关初始状态
        const response = await apiClient.get<{
            _id: string,
            name: string,
            email: string,
            ecoPoints: number,
            pushToken?: string // 🆕 后端 getMe 应该返回这个
        }>("/auth/me");
        return response.data;
    },

    updatePushToken: async (token: string | null) => {
        const response = await apiClient.put("/auth/push-token", { pushToken: token });
        return response.data;
    },

    updateProfile: async (data: { dietaryPreferences?: string[], city?: string }) => {
        const response = await apiClient.put<UserInfo>("/auth/profile", data);
        return response.data;
    },

    getLeaderboard: async () => {
        const response = await apiClient.get<LeaderboardData>("/auth/leaderboard");
        return response.data;
    }
};