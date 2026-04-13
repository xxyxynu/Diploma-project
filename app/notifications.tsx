import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { notificationApi, NotificationItem } from "../api/notification";
import { WeeklyReportModal } from "../components/WeeklyReportModal";
import { translations } from "../i18n/translations";
import { useUserStore } from "../store/userStore";
import Toast from "react-native-toast-message";

export default function NotificationsScreen() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { language } = useUserStore();
    const t = translations[language];

    // Modal State
    const [reportVisible, setReportVisible] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const data = await notificationApi.getAll();
            setNotifications(data);
        } catch (error) {
            console.error("Failed to load notifications");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationApi.markAllRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            Toast.show({
                type: 'success',
                text1: t.allReadSuccess,
            });
        } catch (error) {
            Toast.show({ type: 'error', text1: t.detailError });
        }
    };

    const handleClearAll = async () => {
        if (notifications.length === 0) return;
        Alert.alert(
            t.clearAllTitle,
            t.clearAllDesc,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.clearAll,
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setNotifications([]);
                            await notificationApi.deleteAll();

                            Toast.show({
                                type: 'success',
                                text1: t.inboxCleared,
                            });
                        } catch (error) {
                            fetchData();
                            Toast.show({ type: 'error', text1: t.detailError });
                        }
                    }
                }
            ]
        );
    };

    const handleDelete = async (id: string) => {
        try {
            setNotifications(prev => prev.filter(n => n._id !== id));
            await notificationApi.delete(id);

            Toast.show({
                type: 'success',
                text1: t.notificationDeleted,
                position: 'bottom',
                visibilityTime: 1500
            });
        } catch (error) {
            fetchData();
            Toast.show({ type: 'error', text1: t.detailError });
        }
    };

    const handlePress = async (item: NotificationItem) => {
        if (!item.isRead) {
            notificationApi.markRead(item._id);
            setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, isRead: true } : n));
        }

        switch (item.type) {
            case 'community':
                if (item.data?.postId) router.push({ pathname: "/community/[id]", params: { id: item.data.postId } });
                break;
            case 'expiry':
                router.push("/(tabs)/expiring");
                break;
            case 'report':
                if (item.data?.stats) {
                    setReportData(item.data.stats);
                    setReportVisible(true);
                }
                break;
            default: break;
        }
    };

    // 🎨 UI Helper: 根据类型返回颜色和图标
    const getStyle = (type: string) => {
        switch (type) {
            case 'expiry':
                return { icon: 'alert-circle', color: '#EF4444', bg: 'bg-red-100', borderColor: 'border-red-100' };
            case 'community':
                return { icon: 'account-group', color: '#8B5CF6', bg: 'bg-violet-100', borderColor: 'border-violet-100' };
            case 'report':
                return { icon: 'poll', color: '#0EA5E9', bg: 'bg-sky-100', borderColor: 'border-sky-100' };
            case 'message':
                return { icon: 'chat', color: '#10B981', bg: 'bg-emerald-100', borderColor: 'border-emerald-100' };
            default:
                return { icon: 'bell', color: '#F59E0B', bg: 'bg-amber-100', borderColor: 'border-amber-100' };
        }
    };

    // 格式化时间 (例如 "2h ago", "Yesterday")
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;

        if (diff < 60) return t.justNow;
        if (diff < 3600) return t.minutesAgo(Math.floor(diff / 60));
        if (diff < 86400) return t.hoursAgo(Math.floor(diff / 3600));
        if (diff < 172800) return t.yesterday;
        return date.toLocaleDateString(t.dateLocale);
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* --- Header --- */}
            <View className="pt-16 pb-6 px-6 bg-white  z-10 flex-row justify-between items-center">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4 p-1 rounded-full active:bg-gray-100">
                        <Ionicons name="arrow-back" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <View>
                        <Text className="text-2xl font-pbold text-slate-900">{t.inbox}</Text>
                        <Text className="text-xs text-gray-400 font-pmedium">
                            {t.unreadMessages(notifications.filter(n => !n.isRead).length)}
                        </Text>
                    </View>
                </View>

                <View className="flex-row gap-2">
                    <TouchableOpacity onPress={handleMarkAllRead} className="p-3 bg-gray-50 rounded-full">
                        <Ionicons name="checkmark-done" size={20} color="#D97706" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleClearAll} className="p-3 bg-gray-50 rounded-full">
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- List --- */}
            <FlatList
                data={notifications}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#F59E0B" />}

                ListEmptyComponent={
                    <View className="items-center mt-32 opacity-50">
                        <Image
                            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486744.png' }}
                            style={{ width: 120, height: 120, marginBottom: 16 }}
                            resizeMode="contain"
                        />
                        <Text className="text-lg font-pbold text-gray-400">{t.allCaughtUp}</Text>
                        <Text className="text-sm text-gray-400">{t.noNewNotifications}</Text>
                    </View>
                }

                renderItem={({ item }) => {
                    const style = getStyle(item.type);
                    return (
                        <View className="relative mb-4">
                            {/* Swipe/Delete Action could go here, but keeping it simple with a button */}

                            <TouchableOpacity
                                onPress={() => handlePress(item)}
                                activeOpacity={0.7}
                                className={`flex-row p-4 rounded-3xl ${item.isRead ? 'bg-white border-gray-100' : 'bg-white border-amber-200 shadow-amber-100'
                                    }`}
                            >
                                {/* 1. Icon Column */}
                                <View className={`w-12 h-12 rounded-2xl items-center justify-center mr-4 ${style.bg}`}>
                                    <MaterialCommunityIcons name={style.icon as any} size={24} color={style.color} />
                                </View>

                                {/* 2. Content Column */}
                                <View className="flex-1 mr-2">
                                    <View className="flex-row justify-between items-start mb-1">
                                        <Text className={`text-base flex-1 mr-2 ${item.isRead ? 'font-pbold text-gray-800' : 'font-pbold text-slate-900'}`}>
                                            {item.title}
                                        </Text>
                                        <Text className="text-[10px] text-gray-400 font-medium mt-1">
                                            {formatTime(item.createdAt)}
                                        </Text>
                                    </View>

                                    <Text className={`text-sm leading-5 ${item.isRead ? 'text-gray-400' : 'text-gray-600 font-pmedium'}`} numberOfLines={2}>
                                        {item.message}
                                    </Text>
                                </View>

                                {/* 3. Delete Action (Right Side) */}
                                <TouchableOpacity
                                    onPress={() => handleDelete(item._id)}
                                    className="justify-center pl-3 border-l border-gray-100"
                                >
                                    <Ionicons name="close" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </TouchableOpacity>

                            {/* Unread Indicator (New Badge) */}
                            {!item.isRead && (
                                <View className="absolute -top-2 -right-1 bg-amber-500 px-2 py-0.5 rounded-full border-2 border-gray-50 shadow-sm">
                                    <Text className="text-[8px] font-bold text-white uppercase">{t.newBadge}</Text>
                                </View>
                            )}
                        </View>
                    );
                }}
            />

            <WeeklyReportModal visible={reportVisible} data={reportData} onClose={() => setReportVisible(false)} />
        </View>
    );
}