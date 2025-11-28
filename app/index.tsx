import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

export default function SplashScreen() {
    const router = useRouter();

    useEffect(() => {
        // 模拟加载数据，3秒后跳转到 Onboarding 页面
        const timer = setTimeout(() => {
            // 使用 replace 防止用户点返回键回到启动页
            router.replace("/(auth)/onboarding");
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 bg-primary items-center justify-center relative">
            {/* --- 背景装饰 (云朵) --- */}
            {/* 左上角的云 */}
            <View className="absolute top-20 -left-12 opacity-20">
                <Ionicons name="cloud" size={120} color="white" />
            </View>
            {/* 右下角的云 */}
            <View className="absolute bottom-32 -right-12 opacity-20">
                <Ionicons name="cloud" size={140} color="white" />
            </View>

            {/* --- 中间 Logo 区域 --- */}
            <Animated.View
                entering={FadeInDown.duration(1000).springify()}
                className="items-center"
            >
                {/* Logo 容器 */}
                <View className="w-32 h-32 bg-white rounded-3xl items-center justify-center shadow-2xl mb-6 relative">
                    {/* 黄色标签 (New!) */}
                    <View className="absolute -top-3 -right-4 bg-secondary-middle px-3 py-1 rounded-full z-10 shadow-sm">
                        <Text className="text-white text-xs font-bold">New!</Text>
                    </View>

                    {/* 绿叶图标 */}
                    <Ionicons name="leaf-outline" size={64} color="#22C55E" />
                </View>

                {/* 文字标题 */}
                <Text className="text-4xl font-pbold text-white tracking-wider">
                    EcoCart
                </Text>
                <Text className="text-white text-lg font-pmedium mt-2 opacity-90">
                    Your Food Buddy 🌱
                </Text>
            </Animated.View>

            {/* --- 底部加载点 (简单的动画模拟) --- */}
            <Animated.View
                entering={FadeIn.delay(500).duration(1000)}
                className="absolute bottom-20 flex-row space-x-2"
            >
                <View className="w-3 h-3 mr-3 bg-white rounded-full opacity-80" />
                <View className="w-3 h-3 mr-3 bg-white rounded-full opacity-60" />
                <View className="w-3 h-3 bg-white rounded-full opacity-40" />
            </Animated.View>
        </View>
    );
}