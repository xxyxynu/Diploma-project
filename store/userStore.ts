import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from "expo-secure-store";
import { authApi } from '@/api/auth';

export interface UserInfo {
    _id: string;
    name: string;
    email: string;
    token: string;
    ecoPoints?: number;
    dietaryPreferences?: string[];
}

// 2. 定义 Store 的状态和动作
interface UserState {
    userInfo: UserInfo | null;
    isLoggedIn: boolean;

    // 动作 (Actions)
    login: (user: UserInfo) => void;
    logout: () => void;
    updateName: (name: string) => void;
    refreshUser: () => Promise<void>; // 🆕 刷新用户信息
    updatePreferences: (prefs: string[]) => void;

}

export const useUserStore = create<UserState>()(
    persist(
        (set) => ({
            userInfo: null,
            isLoggedIn: false,

            login: async (user) => {
                await SecureStore.setItemAsync("user_token", user.token);
                await SecureStore.setItemAsync("user_name", user.name);
                set({ userInfo: user, isLoggedIn: true });
            },

            logout: async () => {
                await SecureStore.deleteItemAsync("user_token");
                await SecureStore.deleteItemAsync("user_name");
                set({ userInfo: null, isLoggedIn: false });
            },


            updateName: (name) =>
                set((state) => ({
                    userInfo: state.userInfo ? { ...state.userInfo, name } : null
                })),
            refreshUser: async () => {
                try {
                    const data = await authApi.getMe();
                    set((state) => ({
                        userInfo: state.userInfo ? { ...state.userInfo, ...data } : null
                    }));
                } catch (error) {
                    console.error("Failed to refresh user info");
                }
            },
            updatePreferences: (prefs) =>
                set((state) => ({
                    userInfo: state.userInfo ? { ...state.userInfo, dietaryPreferences: prefs } : null
                })),
        }),
        {
            name: 'user-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);