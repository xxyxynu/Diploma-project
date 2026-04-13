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
import { communityApi, CommunityPost } from "../../api/community";
import { useUserStore } from "../../store/userStore";
import { translations } from "@/i18n/translations";
import Toast from "react-native-toast-message";

export default function MyPosts() {
    const router = useRouter();
    const { userInfo, language } = useUserStore();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const t = translations[language];

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            const allPosts = await communityApi.getAll();

            // 1. 确保 allPosts 是一个数组
            if (!Array.isArray(allPosts)) {
                setPosts([]);
                return;
            }

            // 2. 使用可选链 ?. 访问 postedBy._id，防止 p.postedBy 为空时崩溃
            const myPosts = allPosts.filter(p => p.postedBy?._id === userInfo?._id);

            setPosts(myPosts);
        } catch (error) {
            console.error("Failed to load my posts", error);
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.fetchPostsError
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };
    const handleMarkTaken = async (id: string) => {
        Alert.alert("Confirm", t.markItemTaken, [
            { text: t.cancel, style: "cancel" },
            {
                text: t.yes, onPress: async () => {
                    try {
                        await communityApi.updateStatus(id, 'taken');
                        Toast.show({
                            type: 'success',
                            text1: t.postMarkedTaken,
                            text2: t.postMarkedTakenDetail
                        });
                        fetchMyPosts();
                    } catch (e) {
                        Toast.show({ type: 'error', text1: t.detailError });
                    }
                }
            }
        ]);
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete", t.areYouSure, [
            { text: t.cancel, style: "cancel" },
            {
                text: t.delete, style: 'destructive', onPress: async () => {
                    try {
                        await communityApi.delete(id);
                        Toast.show({
                            type: 'success',
                            text1: t.postDeletedSuccess
                        });
                        fetchMyPosts();
                    } catch (e) {
                        Toast.show({ type: 'error', text1: t.detailError });
                    }
                }
            }
        ]);
    };

    const getTranslatedStatus = (status: string) => {
        if (status === 'taken') return t.statusTaken;
        if (status === 'reserved') return t.statusReserved;
        return t.statusAvailable;
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center bg-white">
                <ActivityIndicator size="large" color="#F59E0B" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <View className="bg-purple-600 pt-16 pb-8 px-6 rounded-b-[35px] shadow-xl shadow-purple-100 relative overflow-hidden">
                <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />
                <View className="flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30"
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>

                    <View className="items-center">
                        <Text className="text-white text-xl font-pbold">{t.myContributions}</Text>
                        <Text className="text-purple-100 text-[10px] font-pbold uppercase tracking-widest mt-1">
                            {t.postsShared.replace("{count}", posts.length.toString())}
                        </Text>
                    </View>
                    <View style={{ width: 44 }} />
                </View>
            </View>

            <FlatList
                data={posts}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyPosts(); }} tintColor="#F59E0B" />}
                ListEmptyComponent={
                    <View className="items-center justify-center mt-32 px-10">
                        <View className="bg-purple-50 p-8 rounded-full mb-6">
                            <MaterialCommunityIcons name="heart-plus-outline" size={80} color="#A855F7" />
                        </View>
                        <Text className="text-slate-800 text-xl font-pbold text-center">{t.noSharesYet}</Text>
                        <Text className="text-slate-400 text-center font-pregular mt-2">
                            {t.sharePrompt}
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/community/create")}
                            className="mt-8 bg-purple-600 px-10 py-4 rounded-2xl shadow-lg shadow-purple-200"
                        >
                            <Text className="text-white font-pbold text-lg text-center">{t.shareMyFirstItem}</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="bg-white rounded-[32px] p-5 mb-5 shadow-sm shadow-slate-200 border border-slate-50 mx-1">
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: `/community/[id]`, params: { id: item._id } })}
                            activeOpacity={0.7}
                            className="flex-row items-center mb-5"
                        >
                            <View className="relative">
                                <View className="w-20 h-20 bg-slate-100 rounded-2xl overflow-hidden shadow-inner">
                                    {item.imageUrl ? (
                                        <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                    ) : (
                                        <View className="w-full h-full items-center justify-center">
                                            <MaterialCommunityIcons name="food-apple-outline" size={32} color="#cbd5e1" />
                                        </View>
                                    )}
                                </View>
                                <View className={`absolute -top-1 -left-1 w-4 h-4 rounded-full border-2 border-white ${item.status === 'available' ? 'bg-green-500' : 'bg-slate-300'}`} />
                            </View>

                            <View className="flex-1 ml-4">
                                <View className="flex-row justify-between items-start mb-1">
                                    <Text className="text-lg font-pbold text-slate-800 flex-1 mr-2" numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                    <View className={`px-2.5 py-1 rounded-lg ${item.status === 'taken' ? 'bg-slate-100' : 'bg-green-50'}`}>
                                        <Text className={`text-[10px] font-pbold uppercase tracking-tighter ${item.status === 'taken' ? 'text-slate-400' : 'text-green-600'}`}>
                                            {getTranslatedStatus(item.status)}
                                        </Text>
                                    </View>
                                </View>
                                <View className="flex-row items-start">
                                    <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                                    <Text className="text-xs text-slate-400 font-pmedium ml-1">
                                        {item.createdAt
                                            ? t.postedOn(new Date(item.createdAt).toLocaleDateString(t.dateLocale))
                                            : '---'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        <View className="flex-row gap-3 pt-4 border-t border-slate-50">
                            {item.status !== 'taken' ? (
                                <TouchableOpacity
                                    onPress={() => handleMarkTaken(item._id)}
                                    className="flex-[2] bg-slate-900 h-12 rounded-2xl flex-row items-center justify-center shadow-md shadow-slate-200"
                                >
                                    <Ionicons name="checkmark-circle-outline" size={18} color="white" />
                                    <Text className="text-white font-pbold text-sm ml-2">{t.markAsTaken}</Text>
                                </TouchableOpacity>
                            ) : (
                                <View className="flex-[2] bg-slate-50 h-12 rounded-2xl items-center justify-center border border-slate-100">
                                    <Text className="text-slate-300 font-pbold text-sm italic">{t.itemClaimed}</Text>
                                </View>
                            )}

                            <TouchableOpacity
                                onPress={() => handleDelete(item._id)}
                                className="flex-1 bg-red-50 h-12 rounded-2xl items-center justify-center border border-red-100"
                            >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}