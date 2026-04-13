import { create } from 'zustand';

interface NetworkState {
    isConnected: boolean;
    setConnected: (status: boolean) => void;
}

export const useNetworkStore = create<NetworkState>((set) => ({
    isConnected: true, // 默认假设有网，避免初始闪烁
    setConnected: (status) => set({ isConnected: status }),
}));