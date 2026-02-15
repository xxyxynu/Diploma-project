import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    RefreshControl,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, ItemStats } from "../../api/food";
import { useUserStore } from "../../store/userStore";
import { useFridgeStore } from "../../store/fridgeStore"; // 🆕 NEW
import { useFridgeInit } from "../../hooks/useFridgeInit"; // 🆕 NEW
import { MenuItem } from "../../components/MenuItem";
import { StatItem } from "../../components/StatItem";
import { authApi } from "@/api/auth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { DietaryModal } from "../../components/DietaryModal"; // 🆕

export default function Profile() {
    const router = useRouter();
    const { userInfo, logout, refreshUser, updatePreferences } = useUserStore();
    const { selectedFridge } = useFridgeStore();
    const { loadFridges } = useFridgeInit();
    const { clearFridges } = useFridgeStore(); // 👈 从 store 获取 clear

    const { registerForPushNotificationsAsync } = usePushNotifications();

    const [stats, setStats] = useState<ItemStats>({ total: 0, fresh: 0, expiring: 0, expired: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const [showDietaryModal, setShowDietaryModal] = useState(false);

    // Fetch data when fridge changes
    useEffect(() => {
        if (selectedFridge) {
            fetchData();
            refreshUser(); // 刷新用户信息
            checkNotificationStatus(); // 检查初始状态
        }
    }, [selectedFridge]); // Refetch when fridge changes

    const fetchData = async () => {
        if (!selectedFridge) {
            setLoading(false);
            return;
        }

        try {
            const data = await foodApi.getStats(selectedFridge._id);
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // 🆕 检查当前用户是否有 Push Token
    const checkNotificationStatus = async () => {
        try {
            const userData = await authApi.getMe();
            // 如果后端有 pushToken，说明开启了
            // @ts-ignore (如果 TS 报错，因为 UserInfo 接口可能还没更新 pushToken 字段)
            setNotificationsEnabled(!!userData.pushToken);
            refreshUser();
        } catch (error) {
            console.error("Failed to check user status");
        }
    };

    // 🆕 处理开关切换
    const toggleNotifications = async (value: boolean) => {
        // 1. 乐观更新 UI
        setNotificationsEnabled(value);

        try {
            if (value) {
                // === 开启通知 ===
                // 1. 获取 Token (如果没权限会弹窗请求)
                const token = await registerForPushNotificationsAsync();

                if (token) {
                    // 2. 发给后端
                    await authApi.updatePushToken(token);
                    Alert.alert("Notifications On", "You will now receive alerts for expiring items.");
                } else {
                    // 获取失败 (用户拒绝权限等)，回滚开关
                    setNotificationsEnabled(false);
                    Alert.alert("Permission Denied", "Please enable notifications in your phone settings.");
                }
            } else {
                // === 关闭通知 ===
                // 发送 null 给后端，清空 Token
                await authApi.updatePushToken(null);
            }
        } catch (error) {
            console.error("Failed to toggle notifications", error);
            // 失败回滚
            setNotificationsEnabled(!value);
            Alert.alert("Error", "Failed to update settings");
        }
    };

    const handleSavePreferences = async (newPrefs: string[]) => {
        try {
            // 1. 更新后端
            await authApi.updateProfile({ dietaryPreferences: newPrefs });
            // 2. 更新本地 Store
            updatePreferences(newPrefs);
            // 3. 提示
            // Alert.alert("Success", "Preferences updated!");
        } catch (error) {
            Alert.alert("Error", "Failed to update profile");
        }
    };

    const getPreferencesText = () => {
        const prefs = userInfo?.dietaryPreferences;
        if (!prefs || prefs.length === 0) return "None";
        if (prefs.length > 2) return `${prefs[0]}, ${prefs[1]} +${prefs.length - 2}`;
        return prefs.join(", ");
    };


    const onRefresh = async () => {
        setRefreshing(true);
        // 并行刷新：冰箱列表、统计数据、用户积分
        await Promise.all([
            loadFridges(),
            fetchData(),
            refreshUser(), // 下拉刷新时同步积分
            checkNotificationStatus()

        ]);
        setRefreshing(false);
    };

    // 退出登录
    const handleLogout = async () => {
        Alert.alert("Log Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await SecureStore.deleteItemAsync("user_token");
                    await SecureStore.deleteItemAsync("user_name");

                    logout();        // 清除用户状态
                    clearFridges();  // 👈 清除冰箱状态

                    router.replace("/login");
                }
            }
        ]);
    };

    if (loading) {
        return (
            <View className="flex-1 bg-[#F8F9FA] items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
                <Text className="text-gray-500 mt-4 font-pmedium">Loading your fridge...</Text>
            </View>
        );
    }

    if (!selectedFridge) {
        return (
            <View className="flex-1 bg-[#F8F9FA] items-center justify-center p-6">
                <MaterialCommunityIcons name="fridge-off-outline" size={80} color="#9CA3AF" />
                <Text className="text-xl font-pbold text-gray-800 mt-4 mb-2">No Fridge Selected</Text>
                <Text className="text-gray-500 text-center mb-6">
                    Create a new fridge or join an existing one to get started
                </Text>
                <TouchableOpacity
                    onPress={() => router.push("/fridge-management/create")}
                    className="bg-primary px-6 py-3 rounded-xl"
                >
                    <Text className="text-white font-pbold">Go Home</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
                }
            >
                {/* --- 1. 顶部 Header 区域 --- */}
                <View className="bg-primary pt-16 pb-32 px-6 rounded-b-[40px] relative overflow-hidden shadow-md">
                    {/* 背景装饰 */}
                    <MaterialCommunityIcons name="leaf" size={140} color="white" style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                    <MaterialCommunityIcons name="food-apple" size={100} color="white" style={{ position: 'absolute', left: -20, top: 20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />

                    {/* 顶部栏 */}
                    <View className="flex-row justify-between items-center mb-6 z-10">
                        <Text className="text-white font-pbold text-2xl">My Profile</Text>
                        <TouchableOpacity className="bg-white/20 p-2.5 rounded-full backdrop-blur-md">
                            <Ionicons name="pencil" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    {/* 用户简介 */}
                    <View className="flex-row items-center z-10">
                        <View className="p-1 bg-white/20 rounded-full mr-4">
                            <Image
                                source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${userInfo?.name || 'User'}` }}
                                className="w-20 h-20 rounded-full bg-white"
                            />
                        </View>
                        <View>
                            <Text className="text-white font-pbold text-2xl">{userInfo?.name || "Guest"}</Text>
                            <Text className="text-green-100 font-pmedium text-sm">{userInfo?.email || "No email"}</Text>
                            <View className="flex-row items-center mt-2 bg-white/20 self-start px-3 py-1 rounded-full">
                                <MaterialCommunityIcons name="crown" size={14} color="#FFD700" />
                                <Text className="text-white text-xs font-bold ml-1">Pro Member</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View className="-mt-20 mx-6 bg-white rounded-[30px] p-6 shadow-lg shadow-gray-200/50 flex-row justify-between items-center">
                    <StatItem
                        value={stats.total}
                        label="Total Items"
                        icon="fridge-outline"
                        color="text-slate-800"
                    />
                    <View className="w-[1px] h-10 bg-gray-100" />
                    <StatItem
                        value={stats.expiring}
                        label="Expiring"
                        icon="alert-circle-outline"
                        color="text-orange-500"
                    />
                    <View className="w-[1px] h-10 bg-gray-100" />

                    {/* 👇 这里显示真实的 Eco Points */}
                    <StatItem
                        value={userInfo?.ecoPoints || 0}
                        label="Eco Points"
                        icon="leaf"
                        color="text-green-500"
                    />
                </View>


                {/* --- 3. 动态状态卡片 (Smart Action) --- */}
                <View className="px-6 mt-6">
                    {stats.expiring > 0 ? (
                        <TouchableOpacity
                            onPress={() => router.push("/(tabs)/expiring")}
                            className="bg-orange-50 border border-orange-100 p-5 rounded-[24px] flex-row items-center justify-between"
                        >
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="warning" size={20} color="#f97316" />
                                </View>
                                <View>
                                    <Text className="text-slate-800 font-pbold text-base">Action Needed</Text>
                                    <Text className="text-slate-500 text-xs mt-0.5">
                                        You have <Text className="text-orange-500 font-bold">{stats.expiring} items</Text> expiring soon.
                                    </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color="#f97316" />
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-green-50 border border-green-100 p-5 rounded-[24px] flex-row items-center">
                            <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                            </View>
                            <View>
                                <Text className="text-slate-800 font-pbold text-base">All Good!</Text>
                                <Text className="text-slate-500 text-xs mt-0.5">Your fridge is fresh and healthy.</Text>
                            </View>
                        </View>
                    )}
                </View>

                {/* --- 4. 设置选项组 --- */}

                {/* Group: Preferences */}
                <View className="px-6 mt-8">
                    <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-3 ml-2">Preferences</Text>
                    <View className="bg-white rounded-[24px] p-2 shadow-sm shadow-gray-100 border border-gray-50">
                        <MenuItem
                            icon="notifications-outline"
                            title="Notifications"
                            rightElement={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={toggleNotifications} // 👈 绑定新函数
                                    trackColor={{ false: "#E2E8F0", true: "#22C55E" }}
                                    thumbColor={"#fff"}
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                />
                            }
                        />

                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <MenuItem
                            icon="restaurant-outline"
                            title="Dietary Restrictions"
                            subtitle={getPreferencesText()} // 🆕 动态显示
                            hasArrow
                            onPress={() => setShowDietaryModal(true)} // 🆕 打开 Modal
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />

                        {/* 👇 修改的部分: My CookBook */}
                        <MenuItem
                            icon="book-outline"
                            title="My CookBook"
                            hasArrow
                            onPress={() => router.push("/cookbook")}
                        />
                    </View>
                </View>

                {/* Group: Account */}
                <View className="px-6 mt-6">
                    <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-3 ml-2">Account</Text>
                    <View className="bg-white rounded-[24px] p-2 shadow-sm shadow-gray-100 border border-gray-50">
                        <MenuItem
                            icon="card-outline"
                            title="Subscription"
                            subtitle="Free Plan"
                            hasArrow
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <MenuItem
                            icon="help-circle-outline"
                            title="Help & Support"
                            hasArrow
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />

                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center p-4"
                        >
                            <View className="w-10 h-10 bg-red-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            </View>
                            <Text className="flex-1 text-red-500 font-pbold text-base">Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="items-center mt-10 mb-6">
                    <Text className="text-gray-300 text-xs">EcoCart v1.0.2</Text>
                </View>

            </ScrollView>

            <DietaryModal
                visible={showDietaryModal}
                initialValues={userInfo?.dietaryPreferences || []}
                onClose={() => setShowDietaryModal(false)}
                onSave={handleSavePreferences}
            />
        </View>
    );

}