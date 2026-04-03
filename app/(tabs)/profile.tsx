import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    RefreshControl,
    ScrollView,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { authApi, LeaderboardData } from "../../api/auth"; // 🆕 引入新类型
import { foodApi, ItemStats } from "../../api/food";
import { DietaryModal } from "../../components/DietaryModal";
import { ImpactDashboard } from "../../components/ImpactDashboard";
import { MenuItem } from "../../components/MenuItem";
import { StatItem } from "../../components/StatItem";
import { useFridgeInit } from "../../hooks/useFridgeInit";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore } from "../../store/userStore";

const CITIES = ['Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktau', 'Atyrau', 'Other'];

export default function Profile() {
    const router = useRouter();
    const { userInfo, logout, refreshUser, updatePreferences, updateCity, updateName } = useUserStore();
    const { selectedFridge, clearFridges } = useFridgeStore();
    const { loadFridges } = useFridgeInit();

    const { registerForPushNotificationsAsync } = usePushNotifications();

    const [stats, setStats] = useState<ItemStats>({ total: 0, fresh: 0, expiring: 0, expired: 0 });
    const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null); // 排行榜状态
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);

    const [showDietaryModal, setShowDietaryModal] = useState(false);
    const [showCityModal, setShowCityModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false); // 编辑资料的 Modal 状态

    const [editName, setEditName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (selectedFridge) {
            initData();
        }
    }, [selectedFridge]);

    const initData = async () => {
        await Promise.all([
            fetchStats(),
            fetchLeaderboard(), // 并行拉取排行榜
            checkNotificationStatus(),
            refreshUser()
        ]);
        setLoading(false);
    };

    const fetchStats = async () => {
        if (!selectedFridge) return;
        try {
            const data = await foodApi.getStats(selectedFridge._id);
            setStats(data);
        } catch (error) {
            console.error("Failed to load stats");
        }
    };

    // 获取排行榜
    const fetchLeaderboard = async () => {
        try {
            const data = await authApi.getLeaderboard();
            setLeaderboard(data);
        } catch (error) {
            console.error("Failed to load leaderboard");
        }
    };

    const checkNotificationStatus = async () => {
        try {
            const userData = await authApi.getMe();
            // @ts-ignore
            setNotificationsEnabled(!!userData.pushToken);
        } catch (error) {
            console.error("Failed to check settings");
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
                    Alert.alert("Permission Denied", "Please enable notifications in settings.");
                }
            } else {
                await authApi.updatePushToken(null);
            }
        } catch (error) {
            setNotificationsEnabled(!value);
            Alert.alert("Error", "Failed to update settings");
        }
    };

    const handleSavePreferences = async (newPrefs: string[]) => {
        try {
            await authApi.updateProfile({ dietaryPreferences: newPrefs });
            updatePreferences(newPrefs);
        } catch (error) {
            Alert.alert("Error", "Failed to update preferences");
        }
    };

    const handleSaveCity = async (newCity: string) => {
        try {
            await authApi.updateProfile({ city: newCity });
            // @ts-ignore
            if (updateCity) updateCity(newCity);
            else refreshUser();
            setShowCityModal(false);

            // 切换城市后刷新排行榜
            fetchLeaderboard();
        } catch (error) {
            Alert.alert("Error", "Failed to update city");
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadFridges(),
            fetchStats(),
            fetchLeaderboard(),
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

    const handleSaveProfile = async () => {
        if (!editName.trim()) {
            Alert.alert("Error", "Name cannot be empty");
            return;
        }

        setIsSaving(true);

        try {
            // 你需要在后端的 updateProfile 接口支持接收 { name } 参数 (稍后会告诉你怎么改后端)
            await authApi.updateProfile({ name: editName.trim() } as any);

            // 更新本地 Store
            updateName(editName.trim());
            setShowEditProfileModal(false);
            Alert.alert("Success", "Profile updated!");

            // 刷新以更新排行榜中的名字
            fetchLeaderboard();
        } catch (error) {
            Alert.alert("Error", "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const getPreferencesText = () => {
        const prefs = userInfo?.dietaryPreferences;
        if (!prefs || prefs.length === 0) return "None";
        if (prefs.length > 2) return `${prefs[0]}, ${prefs[1]} +${prefs.length - 2}`;
        return prefs.join(", ");
    };

    // ==========================================
    // 🏆 Level & Achievement System Logic
    // ==========================================
    const points = userInfo?.ecoPoints || 0;

    const currentLevel = Math.floor(points / 100) + 1;
    const nextLevelPoints = currentLevel * 100;
    const pointsToNextLevel = nextLevelPoints - points;
    const levelProgress = (points % 100) / 100;

    // @ts-ignore
    const effStats = userInfo?.efficiencyStats || { itemsConsumed: 0, itemsWasted: 0 };
    const totalActions = effStats.itemsConsumed + effStats.itemsWasted;
    const zeroWasteRate = totalActions > 0 ? (effStats.itemsConsumed / totalActions) : 0;

    const achievements = [
        {
            id: 'beginner',
            title: 'First Step',
            desc: 'Joined EcoCart',
            icon: 'leaf',
            color: '#10B981',
            unlocked: true
        },
        {
            id: 'saver',
            title: 'Food Saver',
            desc: 'Consumed 10',
            icon: 'food-apple',
            color: '#F59E0B',
            unlocked: effStats.itemsConsumed >= 10
        },
        {
            id: 'sharer',
            title: 'Comm. Hero',
            desc: 'Shared food',
            icon: 'account-group',
            color: '#8B5CF6',
            unlocked: points >= 50
        },
        {
            id: 'master',
            title: 'Zero Waste',
            desc: '>90% Efficiency',
            icon: 'crown',
            color: '#F59E0B',
            unlocked: totalActions >= 10 && zeroWasteRate >= 0.9
        }
    ];

    if (loading) {
        return (
            <View className="flex-1 bg-[#F8F9FA] items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
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
                        <TouchableOpacity
                            onPress={() => {
                                setEditName(userInfo?.name || ""); // 预填当前名字
                                setShowEditProfileModal(true);
                            }}
                            className="bg-white/20 p-2.5 rounded-full backdrop-blur-md"
                        >
                            <Ionicons name="pencil" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <View className="flex-row items-center z-10">
                        <View className="relative mr-4">
                            <View className="p-1 bg-white/20 rounded-full">
                                <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${userInfo?.name || 'User'}` }} className="w-20 h-20 rounded-full bg-white" />
                            </View>
                            <View className="absolute -bottom-1 -right-1 bg-amber-400 px-2 py-1 rounded-full border-2 border-white shadow-sm">
                                <Text className="text-white font-extrabold text-xs">Lv.{currentLevel}</Text>
                            </View>
                        </View>

                        <View className="flex-1">
                            <Text className="text-white font-pbold text-2xl" numberOfLines={1}>{userInfo?.name || "Guest"}</Text>
                            <Text className="text-green-100 font-pmedium text-sm mb-2">{userInfo?.email || "No email"}</Text>

                            <View className="bg-white/20 h-1.5 w-full rounded-full overflow-hidden mt-1">
                                <View
                                    className="bg-amber-400 h-full rounded-full"
                                    style={{ width: `${levelProgress * 100}%` }}
                                />
                            </View>
                            <Text className="text-white/80 text-[10px] font-bold mt-1 text-right">
                                {pointsToNextLevel} pts to Lv.{currentLevel + 1}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* --- 2. Stats Grid --- */}
                <View className="-mt-20 mx-6 bg-white rounded-[30px] p-6 shadow-lg shadow-gray-200/50 flex-row justify-between items-center">
                    <StatItem value={stats.total} label="Total Items" icon="fridge-outline" color="text-slate-800" />
                    <View className="w-[1px] h-10 bg-gray-100" />
                    <StatItem value={stats.expiring} label="Expiring" icon="alert-circle-outline" color="text-orange-500" />
                    <View className="w-[1px] h-10 bg-gray-100" />
                    <StatItem value={points} label="Eco Points" icon="leaf" color="text-green-500" />
                </View>

                {/* --- 3. Achievements & Badges --- */}
                <View className="mx-6 mt-6 bg-white rounded-[30px] py-6">
                    <View className="flex-row justify-between items-center mb-4 px-6">
                        <Text className="text-lg font-pbold text-slate-800">Achievements</Text>
                        <Text className="text-green-600 font-bold text-xs">
                            {achievements.filter(a => a.unlocked).length} / {achievements.length}
                        </Text>
                    </View>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 16, gap: 16 }}
                    >
                        {achievements.map((badge, index) => (
                            <View key={index} className={`items-center w-[72px] ${badge.unlocked ? 'opacity-100' : 'opacity-40'}`}>
                                <View
                                    className="w-14 h-14 rounded-full items-center justify-center mb-2 shadow-sm "
                                    style={{ backgroundColor: badge.unlocked ? `${badge.color}15` : '#F3F4F6' }}
                                >
                                    <MaterialCommunityIcons
                                        name={badge.icon as any}
                                        size={26}
                                        color={badge.unlocked ? badge.color : '#9CA3AF'}
                                    />
                                </View>
                                <Text className="text-xs font-bold text-slate-700 text-center w-full" numberOfLines={1}>{badge.title}</Text>
                                <Text className="text-[9px] text-gray-400 text-center mt-0.5 leading-tight">{badge.desc}</Text>
                            </View>
                        ))}
                    </ScrollView>
                </View>

                {/* --- 4. 🏆 Leaderboard (Real Data) --- */}
                <View className="mx-6 mt-6 bg-white rounded-[30px] p-6 ">
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-pbold text-slate-800">City Leaderboard</Text>
                        <Text className="text-gray-400 text-xs font-pmedium">{leaderboard?.city || 'Loading...'}</Text>
                    </View>

                    {leaderboard?.topUsers.slice(0, 3).map((user, index) => {
                        // 动态颜色：第一名金，第二名银，第三名铜
                        let rankColor = "text-gray-400";
                        if (index === 0) rankColor = "text-amber-500";
                        if (index === 1) rankColor = "text-slate-400";
                        if (index === 2) rankColor = "text-orange-400";

                        const isMe = user._id === userInfo?._id;

                        return (
                            <View key={user._id} className="flex-row items-center mb-4">
                                <Text className={`${rankColor} font-extrabold text-lg w-6`}>{index + 1}</Text>
                                <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${user.name}` }} className="w-10 h-10 rounded-full bg-gray-100 mr-3" />
                                <Text className={`flex-1 font-pbold ${isMe ? 'text-green-600' : 'text-slate-800'}`}>
                                    {isMe ? "You" : user.name}
                                </Text>
                                <Text className="font-bold text-green-600">{user.ecoPoints} pt</Text>
                            </View>
                        );
                    })}

                    {/* 显示当前用户的排名 (如果没有进前3) */}
                    {leaderboard && ((typeof leaderboard.myRank === 'number' && leaderboard.myRank > 3) || leaderboard.myRank === '-') && (
                        <View className="flex-row items-center bg-green-50 p-3 rounded-2xl -mx-3 border border-green-100 mt-2">
                            <Text className="text-green-700 font-extrabold text-lg w-6 text-center mr-3">{leaderboard.myRank}</Text>
                            <Image source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${userInfo?.name || 'User'}` }} className="w-10 h-10 rounded-full bg-white mr-3" />
                            <View className="flex-1">
                                <Text className="font-pbold text-green-900">You</Text>
                                <Text className="text-[10px] text-green-700">Top {leaderboard.topPercentage}% in city</Text>
                            </View>
                            <Text className="font-bold text-green-700">{points} pts</Text>
                        </View>
                    )}
                </View>

                {/* --- 5. Impact Dashboard (Charts) --- */}
                <ImpactDashboard
                    ecoPoints={points}
                    // @ts-ignore
                    history={userInfo?.pointsHistory || []}
                    // @ts-ignore
                    efficiency={effStats}
                    stats={stats}
                />

                {/* --- 6. Preferences --- */}
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

                        <MenuItem
                            icon="location-outline"
                            title="My City"
                            // @ts-ignore
                            subtitle={userInfo?.city || "Almaty"}
                            hasArrow
                            onPress={() => setShowCityModal(true)}
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />

                        <MenuItem
                            icon="restaurant-outline"
                            title="Dietary Restrictions"
                            subtitle={getPreferencesText()}
                            hasArrow
                            onPress={() => setShowDietaryModal(true)}
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />

                        <MenuItem
                            icon="calendar-outline"
                            title="Meal Planner"
                            subtitle="Weekly meal plan & AI suggestions"
                            hasArrow
                            onPress={() => router.push("/meal-plan")}
                        />
                        <View className="h-[1px] bg-gray-50 mx-4" />

                        <MenuItem
                            icon="book-outline"
                            title="My CookBook"
                            subtitle="Saved Recipes"
                            hasArrow
                            onPress={() => router.push("/cookbook")}
                        />
                    </View>
                </View>

                {/* --- 7. Account --- */}
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


            {/* --- Modals --- */}

            {/* 1. Dietary Modal */}
            <DietaryModal
                visible={showDietaryModal}
                initialValues={userInfo?.dietaryPreferences || []}
                onClose={() => setShowDietaryModal(false)}
                onSave={handleSavePreferences}
            />

            {/* 2. City Picker Modal (Inline Simple Modal) */}
            <Modal visible={showCityModal} transparent animationType="slide" onRequestClose={() => setShowCityModal(false)}>
                <View className="flex-1 bg-black/50 justify-end">
                    <View className="bg-white rounded-t-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-pbold text-slate-800">Select City</Text>
                            <TouchableOpacity onPress={() => setShowCityModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                        <View className="flex-row flex-wrap gap-3 mb-8">
                            {CITIES.filter(c => c !== 'All').map(city => (
                                <TouchableOpacity
                                    key={city}
                                    onPress={() => handleSaveCity(city)}
                                    // @ts-ignore
                                    className={`px-4 py-3 rounded-xl border ${userInfo?.city === city ? 'bg-primary border-primary' : 'bg-white border-gray-200'}`}
                                >
                                    <Text className={`font-pbold ${
                                        // @ts-ignore
                                        userInfo?.city === city ? 'text-white' : 'text-gray-600'
                                        }`}>
                                        {city}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </Modal>

            <Modal visible={showEditProfileModal} transparent animationType="fade" onRequestClose={() => setShowEditProfileModal(false)}>
                <View className="flex-1 bg-black/50 justify-center px-6">
                    <View className="bg-white rounded-3xl p-6">
                        <View className="flex-row justify-between items-center mb-6">
                            <Text className="text-xl font-pbold text-slate-800">Edit Profile</Text>
                            <TouchableOpacity onPress={() => setShowEditProfileModal(false)}>
                                <Ionicons name="close" size={24} color="#64748b" />
                            </TouchableOpacity>
                        </View>

                        <Text className="text-gray-500 font-pmedium mb-2">Display Name</Text>
                        <TextInput
                            value={editName}
                            onChangeText={setEditName}
                            placeholder="Enter your name"
                            className="bg-gray-100 p-4 rounded-xl font-pbold text-slate-800 mb-8"
                            autoFocus
                        />

                        <TouchableOpacity
                            onPress={handleSaveProfile}
                            className="bg-primary py-4 rounded-2xl items-center shadow-sm shadow-green-200"
                        >
                            <Text className="text-white font-pbold text-lg">Save Changes</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>


        </View>
    );
}