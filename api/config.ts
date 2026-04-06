import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;


const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync("user_token");
            if (token) {

                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("读取 Token 失败", error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        if (error.response?.status === 401) {
            try {
                // 清除本地存储的过期 Token
                await SecureStore.deleteItemAsync("user_token");
                await SecureStore.deleteItemAsync("user_name");
            } catch (e) {
                console.error("清除 Token 失败", e);
            }

            const authError = new Error("Unauthorized");
            (authError as any).isAuthError = true;
            return Promise.reject(authError);
        }

        return Promise.reject(error);
    }
);

export default apiClient;