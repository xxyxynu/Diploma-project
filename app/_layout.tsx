import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold
} from "@expo-google-fonts/poppins";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import "./globals.css"; // 确保引入了全局样式

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, error] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // 字体加载完了，隐藏启动屏，显示 App
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null; // 在字体加载好之前不渲染任何东西
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* (tabs) 文件夹是底部导航，隐藏原生 Header */}
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* (auth) 文件夹不需要 Header */}
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      {/* 详情页通常需要一个返回按钮，所以可以开启 Header */}
      <Stack.Screen
        name="food/[id]"
        options={{ title: "食品详情", headerShown: true }}
      />
      <Stack.Screen
        name="add-manual"
        options={{ title: "手动添加", presentation: "modal" }}
      />
    </Stack>
  );
}