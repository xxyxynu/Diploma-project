import axios from "axios";
import * as SecureStore from "expo-secure-store";

// 如果你用真机调试，请把 'localhost' 换成你电脑的局域网 IP
// Android 模拟器可以使用 '10.0.2.2'
// iOS 模拟器可以使用 'localhost'
const BASE_URL = "http://172.20.10.3:3000/api";

// 创建 axios 实例
const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// 请求拦截器：每次请求前，自动把 Token 放到 Header 里
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

// ✅ 修复3：新增响应拦截器，处理 Token 过期
// 原来没有响应拦截器，Token 过期后用户会看到网络错误，而不是被重定向到登录页
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

            // 注意：在拦截器里无法直接调用 expo-router 的 router.replace()
            // 推荐的做法是在 userStore 里监听一个 isAuthenticated 状态，
            // 当它变为 false 时，由 _layout.tsx 的 useEffect 负责跳转登录页。
            // 这里我们通过抛出一个带标记的错误，让上层 Store 处理：
            const authError = new Error("Unauthorized");
            (authError as any).isAuthError = true;
            return Promise.reject(authError);
        }

        return Promise.reject(error);
    }
);

export default apiClient;