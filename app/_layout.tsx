import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { use, useEffect } from "react";
import "./globals.css";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OfflineBanner } from "@/components/OfflineBanner";
import { useNetworkStore } from "@/store/networkStore";
import * as Network from 'expo-network';
import Toast, { ToastConfig } from 'react-native-toast-message';
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const toastConfig: ToastConfig = {
  // 成功提示 (深灰背景 + 绿色图标)
  success: ({ text1, text2 }) => (
    <View className="bg-gray-800 px-5 py-3 rounded-full flex-row items-center shadow-md shadow-gray-400 mt-2 mx-6">
      <Ionicons name="checkmark-circle" size={24} color="#34D399" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-pbold text-sm">{text1}</Text>
        {text2 ? <Text className="text-gray-300 text-[10px] mt-0.5">{text2}</Text> : null}
      </View>
    </View>
  ),
  // 错误提示 (深灰背景 + 红色图标)
  error: ({ text1, text2 }) => (
    <View className="bg-gray-800 px-5 py-3 rounded-full flex-row items-center shadow-lg shadow-gray-300 mt-2 mx-6">
      <Ionicons name="alert-circle" size={24} color="#EF4444" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-pbold text-sm">{text1}</Text>
        {text2 ? <Text className="text-gray-300 text-[10px] mt-0.5">{text2}</Text> : null}
      </View>
    </View>
  ),
  // 信息提示 (深灰背景 + 蓝色图标)
  info: ({ text1, text2 }) => (
    <View className="bg-gray-800 px-5 py-3 rounded-full flex-row items-center shadow-lg shadow-gray-300 mt-2 mx-6">
      <Ionicons name="information-circle" size={24} color="#3B82F6" />
      <View className="ml-3 flex-1">
        <Text className="text-white font-pbold text-sm">{text1}</Text>
        {text2 ? <Text className="text-gray-300 text-[10px] mt-0.5">{text2}</Text> : null}
      </View>
    </View>
  )
};

export default function RootLayout() {
  usePushNotifications();
  const { setConnected } = useNetworkStore();

  const [fontsLoaded, error] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
  });

  useEffect(() => {
    // 初始检查
    const checkInitialNetwork = async () => {
      const networkState = await Network.getNetworkStateAsync();
      setConnected(!!networkState.isConnected && !!networkState.isInternetReachable);
    };
    checkInitialNetwork();

    // 2. 持续监听 (这个 API 是同步返回监听器的，不需要 async)
    // TypeScript 会自动推断 subscription 的类型，不需要手动声明
    const subscription = Network.addNetworkStateListener((state) => {
      setConnected(!!state.isConnected && !!state.isInternetReachable);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (fontsLoaded) {
      // Hide splash screen when fonts are loaded
      SplashScreen.hideAsync().catch((err) => {
        console.warn('Error hiding splash screen:', err);
      });
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="fridge-management" options={{ headerShown: false }} />
        <Stack.Screen name="shopping-list/index" options={{ headerShown: false }} />
        <Stack.Screen name="community/index" options={{ headerShown: false }} />
        <Stack.Screen name="cookbook/index" options={{ headerShown: false }} />
        <Stack.Screen
          name="food/[id]"
          options={{ title: "Food Details", headerShown: false }}
        />
        <Stack.Screen
          name="add-manual"
          options={{ title: "Add Item", presentation: "modal" }}
        />
        <Stack.Screen
          name="meal-plan/index"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="receipt-review"
          options={{ title: "Receipt Review", presentation: "modal" }}
        />
      </Stack>

      {/* 将 Toast 挂载在全树的最底端，保证它能覆盖所有页面 */}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  );
}