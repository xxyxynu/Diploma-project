import axios from "axios";
import * as SecureStore from "expo-secure-store";

// ⚠️ 注意：如果你用真机调试，请把 'localhost' 换成你电脑的局域网 IP
// Android 模拟器可以使用 '10.0.2.2'
// iOS 模拟器可以使用 'localhost'
const BASE_URL = "http://172.20.10.3:3000/api"; // 👈 请改成你的实际 IP 和端口

// 创建 axios 实例
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000, // 10秒超时
    headers: {
        "Content-Type": "application/json",
    },
});

// 🔒 请求拦截器：每次请求前，自动把 Token 放到 Header 里
apiClient.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync("user_token");
            if (token) {
                // 如果有 token，加到 Authorization 头里
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

export default apiClient;