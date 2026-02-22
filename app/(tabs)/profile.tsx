import { authApi } from "@/api/auth";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions, // 🆕 引入 Dimensions
    Image,
    RefreshControl,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, ItemStats } from "../../api/food";
import { MenuItem } from "../../components/MenuItem";
import { StatItem } from "../../components/StatItem";
import { useFridgeInit } from "../../hooks/useFridgeInit";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore } from "../../store/userStore";

const screenWidth = Dimensions.get("window").width;

export default function Profile() {
    const router = useRouter();
    const { userInfo, logout, refreshUser } = useUserStore();
    const { selectedFridge } = useFridgeStore();
    const { loadFridges } = useFridgeInit();
    const { clearFridges } = useFridgeStore();

    const { registerForPushNotificationsAsync } = usePushNotifications();

    const [stats, setStats] = useState<ItemStats>({ total: 0, fresh: 0, expiring: 0, expired: 0 });
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    useEffect(() => {
        if (selectedFridge) {
            fetchData();
            refreshUser();
            checkNotificationStatus();
        }
    }, [selectedFridge]);

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

    const checkNotificationStatus = async () => {
        try {
            const userData = await authApi.getMe();
            // @ts-ignore
            setNotificationsEnabled(!!userData.pushToken);
            refreshUser();
        } catch (error) {
            console.error("Failed to check user status");
        }
    };

    const toggleNotifications = async (value: boolean) => {
        setNotificationsEnabled(value);
        try {
            if (value) {
                const token = await registerForPushNotificationsAsync();
                if (token) {
                    await authApi.updatePushToken(token);
                    Alert.alert("Notifications On", "You will now receive alerts for expiring items.");
                } else {
                    setNotificationsEnabled(false);
                    Alert.alert("Permission Denied", "Please enable notifications in your phone settings.");
                }
            } else {
                await authApi.updatePushToken(null);
            }
        } catch (error) {
            setNotificationsEnabled(!value);
            Alert.alert("Error", "Failed to update settings");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadFridges(),
            fetchData(),
            refreshUser(),
            checkNotificationStatus()
        ]);
        setRefreshing(false);
    };

    const handleLogout = async () => {
        Alert.alert("Log Out", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Log Out",
                style: "destructive",
                onPress: async () => {
                    await SecureStore.deleteItemAsync("user_token");
                    await SecureStore.deleteItemAsync("user_name");
                    logout();
                    clearFridges();
                    router.replace("/login");
                }
            }
        ]);
    };

    // 📊 Chart Data Configuration
    const chartData = [
        {
            name: "Fresh",
            population: stats.fresh,
            color: "#22C55E", // Green
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        },
        {
            name: "Expiring",
            population: stats.expiring,
            color: "#F97316", // Orange
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        },
        {
            name: "Expired",
            population: stats.expired,
            color: "#EF4444", // Red
            legendFontColor: "#7F7F7F",
            legendFontSize: 12
        }
    ];

    // 如果没有数据，给个默认值防止图表空崩（或者显示空状态）
    const hasData = stats.total > 0;

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
                <TouchableOpacity onPress={() => router.push("/fridge-management/create")} className="bg-primary px-6 py-3 rounded-xl">
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />}
            >
                {/* --- 1. Header --- */}
                <View className="bg-primary pt-16 pb-32 px-6 rounded-b-[40px] relative overflow-hidden shadow-md">
                    <MaterialCommunityIcons name="leaf" size={140} color="white" style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                    <MaterialCommunityIcons name="food-apple" size={100} color="white" style={{ position: 'absolute', left: -20, top: 20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />

                    <View className="flex-row justify-between items-center mb-6 z-10">
                        <Text className="text-white font-pbold text-2xl">My Profile</Text>
                        <TouchableOpacity className="bg-white/20 p-2.5 rounded-full backdrop-blur-md">
                            <Ionicons name="pencil" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center z-10">
                        <View className="p-1 bg-white/20 rounded-full mr-4">
                            <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${userInfo?.name || 'User'}` }} className="w-20 h-20 rounded-full bg-white" />
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

                {/* --- 2. Stats Grid (Overview) --- */}
                <View className="-mt-20 mx-6 bg-white rounded-[30px] p-6 shadow-lg shadow-gray-200/50 flex-row justify-between items-center">
                    <StatItem value={stats.total} label="Total Items" icon="fridge-outline" color="text-slate-800" />
                    <View className="w-[1px] h-5 bg-gray-100" />
                    <StatItem value={stats.expiring} label="Expiring" icon="alert-circle-outline" color="text-orange-500" />
                    <View className="w-[1px] h-5 bg-gray-100" />
                    <StatItem value={userInfo?.ecoPoints || 0} label="Eco Points" icon="leaf" color="text-green-500" />
                </View>

                <ImpactDashboard
                    ecoPoints={userInfo?.ecoPoints || 0}
                    // @ts-ignore (如果 TS 报错，因为 UserInfo 接口可能还没更新定义)
                    history={userInfo?.pointsHistory || []}
                    // @ts-ignore
                    efficiency={userInfo?.efficiencyStats || { itemsConsumed: 0, itemsWasted: 0 }}
                // 注意：这里不再需要 stats.fresh 等作为效率依据了，因为我们有累计数据
                //stats={stats} // 可以传进去备用，或者删掉
                />

                {/* --- 4. Settings --- */}
                <View className="px-6 mt-8">
                    <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-3 ml-2">Preferences</Text>
                    <View className="bg-white rounded-[24px] p-2 shadow-sm shadow-gray-100 border border-gray-50">
                        <MenuItem
                            icon="notifications-outline"
                            title="Notifications"
                            rightElement={
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={toggleNotifications}
                                    trackColor={{ false: "#E2E8F0", true: "#22C55E" }}
                                    thumbColor={"#fff"}
                                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                                />
                            }
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <MenuItem icon="restaurant-outline" title="Dietary Restrictions" subtitle="Vegetarian" hasArrow />
                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <MenuItem icon="book-outline" title="My CookBook" subtitle="Saved Recipes" hasArrow onPress={() => router.push("/cookbook")} />
                    </View>
                </View>

                {/* --- 5. Account --- */}
                <View className="px-6 mt-6">
                    <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-3 ml-2">Account</Text>
                    <View className="bg-white rounded-[24px] p-2 shadow-sm shadow-gray-100 border border-gray-50">
                        <MenuItem icon="card-outline" title="Subscription" subtitle="Free Plan" hasArrow />
                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <MenuItem icon="help-circle-outline" title="Help & Support" hasArrow />
                        <View className="h-[1px] bg-gray-50 mx-4" />
                        <TouchableOpacity onPress={handleLogout} className="flex-row items-center p-4">
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
        </View>
    );
}