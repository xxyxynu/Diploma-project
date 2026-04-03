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

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  usePushNotifications();

  const [fontsLoaded, error] = useFonts({
    "Poppins-Regular": Poppins_400Regular,
    "Poppins-Medium": Poppins_500Medium,
    "Poppins-SemiBold": Poppins_600SemiBold,
    "Poppins-Bold": Poppins_700Bold,
  });

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
  );
}