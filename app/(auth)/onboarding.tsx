import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
    FlatList,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

// --- 1. 定义数据结构 ---
const SLIDES = [
    {
        id: "1",
        theme: "orange",
        bgColor: "bg-orange-50",
        cardColor: "bg-orange-100",
        mainIcon: "barcode-scan", // MaterialCommunityIcons
        mainIconColor: "#F97316", // orange-500
        title: "Beep! Scanned.",
        description: "Just scan the barcode.\nWe'll pop it into your digital fridge!",
        // 左边浮动标 (Broccoli)
        badge1: { icon: "food-apple", color: "#22c55e", bg: "bg-white", text: null },
        // 右边浮动标 (Receipt)
        badge2: { icon: "receipt", color: "#94a3b8", bg: "bg-white", text: null },
    },
    {
        id: "2",
        theme: "blue",
        bgColor: "bg-blue-50",
        cardColor: "bg-blue-100",
        mainIcon: "piggy-bank-outline",
        mainIconColor: "#3B82F6", // blue-500
        title: "Save that Cash!",
        description: "Get cute reminders before food spoils.\nSave $300/year easily.",
        // 左上浮动标 (Alert)
        badge1: { icon: "bell-ring", color: "#ef4444", bg: "bg-red-100", text: "Alert!" },
        // 右下浮动标 (Money)
        badge2: { icon: "sack", color: "#eab308", bg: "bg-green-100", text: "+$300" },
    },
    {
        id: "3",
        theme: "green",
        bgColor: "bg-green-50",
        cardColor: "bg-green-100",
        mainIcon: "chef-hat",
        mainIconColor: "#22c55e", // green-500
        title: "Yummy Magic",
        description: "Leftovers? No problem.\nTurn them into delicious meals!",
        // 左上浮动标 (Carrot)
        badge1: { icon: "carrot", color: "#f97316", bg: "bg-white", text: null },
        // 右下浮动标 (Food)
        badge2: { icon: "food-turkey", color: "#db2777", bg: "bg-white", text: null },
    },
];

export default function Onboarding() {
    const router = useRouter();
    const { width } = useWindowDimensions();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);

    // 监听滚动结束，更新当前页码
    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index);
        }
    }).current;

    // 点击按钮逻辑
    const handleNext = () => {
        if (currentIndex < SLIDES.length - 1) {
            // 还没到最后一页，滚到下一页
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            // 最后一页，跳转去注册/登录
            router.push("/(auth)/sign-up");
        }
    };

    const handleSkip = () => {
        router.push("/(auth)/sign-up");
    };

    // --- 渲染每一页 (Item) ---
    const renderItem = ({ item }: { item: typeof SLIDES[0] }) => {
        return (
            <View style={{ width }} className={`flex-1 items-center justify-center px-6 ${item.bgColor}`}>

                {/* --- Skip 按钮 (绝对定位在右上角) --- */}
                <TouchableOpacity
                    onPress={handleSkip}
                    className="absolute top-14 right-6 bg-white px-4 py-2 rounded-full shadow-sm z-10"
                >
                    <Text className="text-gray-500 font-pmedium text-sm">Skip</Text>
                </TouchableOpacity>

                {/* --- 中间大卡片区域 --- */}
                <View className="items-center justify-center mb-10">

                    {/* 背景光晕 (模拟渐变效果) */}
                    <View className={`absolute w-72 h-72 rounded-full opacity-30 blur-2xl ${item.theme === 'orange' ? 'bg-orange-300' : item.theme === 'blue' ? 'bg-blue-300' : 'bg-green-300'}`} />

                    {/* 核心卡片容器 */}
                    <View className={`w-64 h-64 ${item.cardColor} rounded-[40px] border-4 border-white items-center justify-center shadow-sm relative`}>

                        {/* 主图标 (中间大的) */}
                        <MaterialCommunityIcons name={item.mainIcon as any} size={100} color={item.mainIconColor} />

                        {/* --- 浮动小徽章 1 (左边/左上) --- */}
                        <Animated.View entering={FadeInDown.delay(200).springify()} className={`absolute -left-6 top-16 bg-white p-3 rounded-2xl shadow-md flex-row items-center space-x-2`}>
                            {item.badge1.text && <Text className="text-xs font-pbold text-secondary-dark mr-1">{item.badge1.text}</Text>}
                            <MaterialCommunityIcons name={item.badge1.icon as any} size={24} color={item.badge1.color} />
                        </Animated.View>

                        {/* --- 浮动小徽章 2 (右边/右下) --- */}
                        <Animated.View entering={FadeInDown.delay(400).springify()} className={`absolute -right-4 top-4 bg-white p-3 rounded-2xl shadow-md flex-row items-center`}>
                            {item.badge2.text && <Text className="text-xs font-pbold text-primary mr-1">{item.badge2.text}</Text>}
                            <MaterialCommunityIcons name={item.badge2.icon as any} size={24} color={item.badge2.color} />
                        </Animated.View>

                        {/* 既然你设计图里还有第三个图标，我针对不同页面补充一下 */}
                        {item.id === '3' && (
                            <View className="absolute -bottom-6 left-10 bg-white p-3 rounded-2xl shadow-md">
                                <MaterialCommunityIcons name="food-variant" size={24} color="#facc15" />
                            </View>
                        )}

                    </View>
                </View>

                {/* --- 文字描述 --- */}
                <View className="items-center space-y-4 px-4 h-32">
                    <Text className="text-3xl font-pbold text-slate-800 text-center">
                        {item.title}
                    </Text>
                    <Text className="text-gray-500 font-pregular text-center text-base leading-6">
                        {item.description}
                    </Text>
                </View>

            </View>
        );
    };

    return (
        <View className="flex-1 bg-white">
            <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderItem}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                keyExtractor={(item) => item.id}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                scrollEventThrottle={32}
            />

            {/* --- 底部控制栏 (Pagination + Button) --- */}
            <View className="absolute bottom-12 w-full px-6 items-center space-y-8">

                {/* 1. 分页指示器 (Dots) */}
                <View className="flex-row space-x-2">
                    {SLIDES.map((_, index) => (
                        <View
                            key={index}
                            className={`h-2.5 mr-2 rounded-full transition-all duration-300 ${currentIndex === index ? "w-6 bg-slate-800" : "w-2.5 bg-gray-300"
                                }`}
                        />
                    ))}
                </View>

                {/* 2. 大按钮 */}
                <TouchableOpacity
                    onPress={handleNext}
                    className={`w-full py-4 mt-8 rounded-2xl flex-row justify-center items-center shadow-lg active:opacity-90 transition-colors ${currentIndex === 2 ? "bg-secondary" : "bg-slate-900"
                        }`}
                >
                    <Text className="text-white font-psemibold text-lg mr-2">
                        {currentIndex === 2 ? "Get Started!" : "Next Step"}
                    </Text>
                    {currentIndex === 2 ? (
                        <Ionicons name="sparkles" size={20} color="white" />
                    ) : (
                        <Ionicons name="arrow-forward" size={20} color="white" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}