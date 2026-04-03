import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { mealPlanApi, MealPlan, DayPlan } from "../api/mealPlan";
import { useFridgeStore } from "../store/fridgeStore";

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export default function MealPlanner() {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore();

    const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    // --- 📅 时间与视图状态 ---
    const [currentDate, setCurrentDate] = useState(new Date()); // 当前浏览的基准日期 (用于翻页)
    const [activeDay, setActiveDay] = useState('Monday');       // 当前选中的星期几

    // --- ✏️ 编辑状态 ---
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingContext, setEditingContext] = useState<{ day: string, type: 'breakfast' | 'lunch' | 'dinner', currentName: string } | null>(null);
    const [editInputValue, setEditInputValue] = useState("");

    useEffect(() => {
        if (!selectedFridge) {
            setLoading(false);
            return;
        }

        // 如果是本周，自动选中今天的 Tab
        const today = new Date();
        if (isSameWeek(currentDate, today)) {
            const dayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1; // 0 是周日
            setActiveDay(DAYS[dayIndex]);
        } else {
            setActiveDay('Monday'); // 看其他周默认选周一
        }

        fetchPlan();
    }, [selectedFridge, currentDate]);

    // 辅助：判断是否是同一周
    const isSameWeek = (d1: Date, d2: Date) => {
        const getMonday = (d: Date) => {
            const date = new Date(d);
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
        };
        return getMonday(d1) === getMonday(d2);
    };

    const fetchPlan = async () => {
        if (!selectedFridge) return;
        setLoading(true);
        try {
            const dateStr = currentDate.toISOString().split('T')[0];
            const data = await mealPlanApi.get(selectedFridge._id, dateStr);
            setMealPlan(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // 翻页逻辑
    const changeWeek = (offset: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + offset * 7);
        setCurrentDate(newDate);
    };

    // 获取某一天对应的具体日期字符串 (e.g. "Oct 12")
    const getDateForDayIndex = (index: number) => {
        const d = new Date(currentDate);
        const currentDay = d.getDay() === 0 ? 6 : d.getDay() - 1;
        d.setDate(d.getDate() - currentDay + index);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // AI 生成
    const handleAIGenerate = async () => {
        if (!selectedFridge) return;
        Alert.alert(
            "AI Chef Generation 👨‍🍳",
            "Overwrite this week's plan using your fridge inventory?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Generate",
                onPress: async () => {
                    setGenerating(true);
                    try {
                        const dateStr = currentDate.toISOString().split('T')[0];
                        const data = await mealPlanApi.generateAI(selectedFridge._id, dateStr);
                        setMealPlan(data);
                    } catch (error) {
                        Alert.alert("Error", "Chef AI is busy.");
                    } finally {
                        setGenerating(false);
                    }
                }
            }
        ]
        );
    };

    // 保存编辑
    const handleSaveEdit = async () => {
        if (!editingContext || !selectedFridge) return;
        try {
            const dateStr = currentDate.toISOString().split('T')[0];
            // 如果清空了输入框，后端会处理为清空该餐
            const updatedPlan = await mealPlanApi.updateMeal(
                selectedFridge._id, dateStr, editingContext.day, editingContext.type, editInputValue
            );
            setMealPlan(updatedPlan);
            setEditModalVisible(false);
        } catch (error) {
            Alert.alert("Error", "Failed to update meal");
        }
    };

    // 清空该餐
    const handleClearMeal = () => {
        setEditInputValue(""); // 置空再保存
        // 也可以直接调 API
    };

    // ================== RENDER HELPERS ==================

    const renderMealCard = (type: 'breakfast' | 'lunch' | 'dinner', icon: string, color: string, bg: string) => {
        const mealData = mealPlan?.plan[activeDay]?.[type];
        const hasRecipe = !!mealData?.recipeName;
        const recipeName = mealData?.recipeName || "Tap to add meal";
        const ingredients = mealData?.ingredients || [];
        const isAI = mealData?.isAiGenerated;

        return (
            <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => {
                    setEditingContext({ day: activeDay, type, currentName: mealData?.recipeName || "" });
                    setEditInputValue(mealData?.recipeName || "");
                    setEditModalVisible(true);
                }}
                className={`bg-white rounded-3xl p-5 mb-4 shadow-sm'}`}
            >
                <View className="flex-row items-center mb-2">
                    <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${bg}`}>
                        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
                    </View>
                    <View className="flex-1">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-1">{type}</Text>
                            {/* 🆕 AI 标签 */}
                            {isAI && (
                                <View className="bg-purple-100 px-2 py-0.5 rounded-md flex-row items-center">
                                    <MaterialCommunityIcons name="robot-outline" size={12} color="#9333EA" />
                                    <Text className="text-purple-700 text-[10px] font-bold ml-1">AI</Text>
                                </View>
                            )}
                        </View>
                        <Text className={`text-lg font-pbold ${hasRecipe ? 'text-slate-800' : 'text-gray-400 italic'}`}>
                            {recipeName}
                        </Text>
                    </View>
                </View>

                {/* 🆕 食材提示 (轻量推荐) */}
                {hasRecipe && ingredients.length > 0 && (
                    <View className="flex-row items-center mt-2 pl-[2px]">
                        <View className="flex-row flex-wrap flex-1 gap-1">
                            {ingredients.slice(0, 3).map((ing, idx) => (
                                <View key={idx} className="bg-gray-50 px-2 py-2 rounded border border-gray-100">
                                    <Text className="text-[10px] text-gray-600">{ing}</Text>
                                </View>
                            ))}
                            {ingredients.length > 3 && <Text className="text-xs text-gray-400">...</Text>}
                        </View>
                    </View>
                )}
            </TouchableOpacity>
        );
    };

    // ====================================================

    if (!selectedFridge) {
        return (
            <View className="flex-1 bg-gray-50 items-center justify-center p-6">
                <MaterialCommunityIcons name="fridge-off-outline" size={80} color="#9CA3AF" />
                <Text className="text-xl font-pbold text-gray-800 mt-4 mb-2">No Fridge Selected</Text>
                <TouchableOpacity onPress={() => router.back()} className="mt-2"><Text className="text-blue-500 font-pbold">Go Back</Text></TouchableOpacity>
            </View>
        );
    }

    // 获取当前周的周一日期显示在 Header
    const getWeekTitle = () => {
        const d = new Date(currentDate);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    };

    return (
        <View className="flex-1 bg-gray-50">
            {/* --- 1. Header (带周切换) --- */}
            <View className="bg-emerald-500 pt-16 pb-4 px-6 rounded-b-[30px] z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <TouchableOpacity onPress={() => router.back()} className="p-1">
                        <Ionicons name="arrow-back" size={26} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-pbold">Meal Planner</Text>
                    <View style={{ width: 28 }} />
                </View>

                {/* 周数切换栏 */}
                <View className="flex-row items-center justify-between bg-black/10 rounded-2xl p-1 mb-2">
                    <TouchableOpacity onPress={() => changeWeek(-1)} className="p-2">
                        <Ionicons name="chevron-back" size={20} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white font-pbold text-sm">{getWeekTitle()}</Text>
                    <TouchableOpacity onPress={() => changeWeek(1)} className="p-2">
                        <Ionicons name="chevron-forward" size={20} color="white" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- 2. Days Tab (带完成度圆点) --- */}
            <View className="bg-white py-3 ">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
                    {DAYS.map((day, index) => {
                        const isActive = activeDay === day;

                        // 计算该天的填充数量 (0~3)
                        let filledCount = 0;
                        if (mealPlan && mealPlan.plan[day]) {
                            if (mealPlan.plan[day].breakfast?.recipeName) filledCount++;
                            if (mealPlan.plan[day].lunch?.recipeName) filledCount++;
                            if (mealPlan.plan[day].dinner?.recipeName) filledCount++;
                        }

                        return (
                            <TouchableOpacity
                                key={day}
                                onPress={() => setActiveDay(day)}
                                className={`items-center px-4 py-2 rounded-2xl ${isActive ? 'bg-emerald-50 border border-emerald-200' : 'bg-transparent'}`}
                            >
                                <Text className={`text-[10px] font-bold mb-1 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {day.substring(0, 3).toUpperCase()}
                                </Text>
                                <Text className={`text-lg font-pbold ${isActive ? 'text-emerald-800' : 'text-slate-800'}`}>
                                    {getDateForDayIndex(index).split(' ')[1]}
                                </Text>

                                {/* 进度圆点 */}
                                <View className="flex-row gap-1 mt-1">
                                    {[0, 1, 2].map(i => (
                                        <View key={i} className={`w-1.5 h-1.5 rounded-full ${i < filledCount ? (isActive ? 'bg-emerald-500' : 'bg-gray-400') : 'bg-gray-200'}`} />
                                    ))}
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* --- 3. Meals Content --- */}
            {loading ? (
                <View className="flex-1 justify-center"><ActivityIndicator size="large" color="#10B981" /></View>
            ) : (
                <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 100 }}>
                    <View className="flex-row justify-between items-end mb-6">
                        <Text className="text-xl font-pbold text-slate-800">{activeDay}</Text>
                        {/* 每天独立的小统计 */}
                        {mealPlan?.plan[activeDay] && (
                            <Text className="text-xs text-gray-400 font-bold">
                                {MEALS.filter(m => mealPlan.plan[activeDay][m]?.recipeName).length} / 3 Planned
                            </Text>
                        )}
                    </View>

                    {renderMealCard('breakfast', 'coffee', '#F59E0B', 'bg-amber-100')}
                    {renderMealCard('lunch', 'food-fork-drink', '#3B82F6', 'bg-blue-100')}
                    {renderMealCard('dinner', 'silverware-variant', '#8B5CF6', 'bg-purple-100')}
                </ScrollView>
            )}

            {/* --- 4. 🤖 AI Generate FAB --- */}
            <TouchableOpacity
                onPress={handleAIGenerate}
                className="absolute bottom-10 right-6 bg-slate-900 w-16 h-16 rounded-full items-center justify-center shadow-xl shadow-slate-400"
            >
                <MaterialCommunityIcons name="magic-staff" size={28} color="white" />
            </TouchableOpacity>

            {/* --- Loading Overlay --- */}
            {generating && (
                <View className="absolute inset-0 bg-black/50 items-center justify-center z-50">
                    <View className="bg-white p-8 rounded-3xl items-center shadow-2xl">
                        <ActivityIndicator size="large" color="#10B981" />
                        <Text className="text-slate-800 font-pbold mt-4 text-xl">AI is planning...</Text>
                        <Text className="text-gray-500 text-sm mt-2 text-center w-48">Scanning fridge inventory and generating 21 meals</Text>
                    </View>
                </View>
            )}

            {/* --- 5. ✏️ Edit Modal --- */}
            <Modal visible={editModalVisible} transparent animationType="fade">
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white w-full rounded-t-[30px] p-6 pb-10">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-pbold text-slate-800 capitalize">{editingContext?.type} Plan</Text>
                            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 mb-2 font-pmedium">What are you having?</Text>
                        <TextInput
                            className="bg-gray-100 p-4 rounded-xl font-pmedium text-gray-800 mb-6 text-lg"
                            value={editInputValue}
                            onChangeText={setEditInputValue}
                            placeholder="e.g. Avocado Toast"
                            autoFocus
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => { handleClearMeal(); handleSaveEdit(); }} // 清空输入框并保存
                                className="flex-1 py-4 bg-red-50 border border-red-100 rounded-2xl items-center"
                            >
                                <Text className="text-red-600 font-bold">Clear Meal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSaveEdit}
                                className="flex-[2] py-4 bg-emerald-500 rounded-2xl items-center shadow-md shadow-emerald-200"
                            >
                                <Text className="text-white font-pbold text-lg">Save Plan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

// 定义常量解决顶部作用域问题
const MEALS: ('breakfast' | 'lunch' | 'dinner')[] = ['breakfast', 'lunch', 'dinner'];