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

export default function MyPosts() {
    const router = useRouter();
    const { userInfo } = useUserStore();
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchMyPosts();
    }, []);

    const fetchMyPosts = async () => {
        try {
            // 这里我们获取所有，然后在前端筛选 "我的"
            // (如果后端支持 /community/mine 接口会更好，但前端筛选也够用)
            const allPosts = await communityApi.getAll();
            const myPosts = allPosts.filter(p => p.postedBy._id === userInfo?._id);
            setPosts(myPosts);
        } catch (error) {
            console.error("Failed to load my posts");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleMarkTaken = async (id: string) => {
        Alert.alert("Confirm", "Mark this item as taken?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes", onPress: async () => {
                    await communityApi.updateStatus(id, 'taken');
                    fetchMyPosts(); // 刷新列表
                }
            }
        ]);
    };

    const handleDelete = async (id: string) => {
        Alert.alert("Delete", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: 'destructive', onPress: async () => {
                    await communityApi.delete(id);
                    fetchMyPosts(); // 刷新列表
                }
            }
        ]);
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
            {/* Header */}
            <View className="bg-white pt-14 pb-4 px-6 border-b border-gray-100 flex-row justify-between items-center">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={28} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-pbold text-slate-800">My Posts</Text>
                <View style={{ width: 28 }} />
            </View>

            <FlatList
                data={posts}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 24, paddingBottom: 50 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMyPosts(); }} tintColor="#F59E0B" />}

                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <MaterialCommunityIcons name="basket-outline" size={60} color="#e5e7eb" />
                        <Text className="text-gray-400 mt-2 font-pmedium">You haven't posted anything yet.</Text>
                        <TouchableOpacity
                            onPress={() => router.push("/community/create")}
                            className="mt-6 bg-purple-500 px-6 py-3 rounded-full shadow-lg shadow-purple-200"
                        >
                            <Text className="text-white font-bold">Create New Post</Text>
                        </TouchableOpacity>
                    </View>
                }

                renderItem={({ item }) => (
                    <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
                        {/* 上半部分：点击跳转详情 */}
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: `/community/[id]`, params: { id: item._id } })}
                            className="flex-row mb-4"
                        >
                            <View className="w-20 h-20 bg-gray-50 rounded-xl mr-4 overflow-hidden items-center justify-center">
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <MaterialCommunityIcons name="food-variant" size={32} color="#cbd5e1" />
                                )}
                            </View>
                            <View className="flex-1 justify-center">
                                <Text className="text-lg font-pbold text-gray-800 mb-1" numberOfLines={1}>{item.name}</Text>
                                <Text className="text-xs text-gray-500 mb-2">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                <View className={`self-start px-2 py-0.5 rounded-md ${item.status === 'taken' ? 'bg-gray-100' : 'bg-green-100'}`}>
                                    <Text className={`text-[12px] font-bold ${item.status === 'taken' ? 'text-gray-500' : 'text-green-700'}`}>
                                        {item.status}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {/* 分割线 */}
                        <View className="h-[1px] bg-gray-100 mb-3" />

                        {/* 下半部分：管理按钮 (Edit/Delete) */}
                        <View className="flex-row gap-3">
                            {/* Mark Taken Button */}
                            {item.status !== 'taken' && (
                                <TouchableOpacity
                                    onPress={() => handleMarkTaken(item._id)}
                                    className="flex-1 flex-row items-center justify-center bg-gray-50 py-2.5 rounded-xl"
                                >
                                    <Text className="text-gray-700 font-semibold text-sm ml-1">Mark Taken</Text>
                                </TouchableOpacity>
                            )}

                            {/* Delete Button */}
                            <TouchableOpacity
                                onPress={() => handleDelete(item._id)}
                                className="flex-1 flex-row items-center justify-center bg-red-50 py-2.5 rounded-xl"
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