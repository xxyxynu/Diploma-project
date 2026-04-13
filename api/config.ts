import axios from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = "http://172.20.10.3:3000/api";


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

            // 如果是登录/注册请求，直接把原始错误抛出，不做任何处理
            const url = error.config?.url || '';
            if (url.includes('/auth/login') || url.includes('/auth/signup') || url.includes('/auth/google')) {
                return Promise.reject(error); // 保留原始 error，让页面自己处理
            }

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