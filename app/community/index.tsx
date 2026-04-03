import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { communityApi, CommunityPost } from "../../api/community";
import { useUserStore } from "../../store/userStore";

const CITIES = ['All', 'Almaty', 'Astana', 'Shymkent', 'Karaganda', 'Aktau', 'Atyrau', 'Other'];
const CATEGORIES = ['All', 'Fruit', 'Vegetables', 'Bakery', 'Canned', 'Cooked', 'Other'];

export default function CommunityFeed() {
    const router = useRouter();
    const { userInfo } = useUserStore();

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 筛选状态
    const [cityFilter, setCityFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    const [isNearby, setIsNearby] = useState(false);
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        fetchPosts();
    }, [cityFilter, isNearby, categoryFilter]);

    const fetchPosts = async () => {
        try {
            const params: any = {};

            if (isNearby && userCoords) {
                params.lat = userCoords.lat;
                params.lng = userCoords.lng;
                params.radius = 20; // 扩大一点范围到 20km
            } else if (cityFilter !== 'All') {
                params.city = cityFilter;
            }

            const data = await communityApi.getAll(params);
            setPosts(data);
        } catch (error) {
            console.error("Failed to load community posts");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        if (isNearby) {
            handleToggleNearby();
        } else {
            fetchPosts();
        }
    };

    const handleToggleNearby = async () => {
        if (isNearby) {
            setIsNearby(false);
            setCityFilter("All");
            return;
        }

        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert("Permission Denied", "Allow location access to find items near you.");
                setLoading(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            setUserCoords({
                lat: location.coords.latitude,
                lng: location.coords.longitude
            });

            setIsNearby(true);
            setCityFilter("All");
        } catch (error) {
            setIsNearby(false);
            setLoading(false);
        }
    };

    const getDisplayPosts = () => {
        let result = [...posts];

        // 1. 类别筛选
        if (categoryFilter !== "All") {
            result = result.filter(p => p.tags.includes(categoryFilter));
        }

        // 2. 排序逻辑
        result.sort((a, b) => {
            // A. 如果开启了 Nearby，且两者都有距离数据 -> 按距离排序 (近 -> 远)
            if (isNearby && a.distance !== undefined && b.distance !== undefined) {
                return a.distance - b.distance;
            }

            // B. 否则按时间排序
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        return result;
    };

    const displayPosts = getDisplayPosts();

    // Status Badge
    const StatusBadge = ({ status }: { status: string }) => {
        if (status === 'reserved') return <View className="bg-blue-100 px-2 py-1 rounded-md"><Text className="text-blue-700 text-[10px] font-bold">RESERVED</Text></View>;
        if (status === 'taken') return <View className="bg-gray-100 px-2 py-1 rounded-md"><Text className="text-gray-500 text-[10px] font-bold">TAKEN</Text></View>;
        return <View className="bg-green-50 px-2 py-1 rounded-md border border-green-100"><Text className="text-green-700 text-[10px] font-bold">FREE</Text></View>;
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center bg-gray-50">
                <ActivityIndicator size="large" color="#9333ea" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            {/* Header */}
            <View className="bg-purple-500 pt-16 pb-4 px-6 rounded-b-[30px] z-10">
                <View className="flex-row justify-between items-center mb-4">
                    <View>
                        <Text className="text-white text-2xl font-pbold">Community</Text>
                        <Text className="text-purple-100 text-sm font-pmedium">Kazakhstan Zero Waste 🇰🇿</Text>
                    </View>

                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={() => router.push("/community/my-posts")} className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                            <Ionicons name="person" size={24} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push("/community/create")} className="bg-white p-3 rounded-full shadow-sm">
                            <Ionicons name="add" size={24} color="#9333ea" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* 排序按钮 (仅在非 Nearby 模式下显示，或者显示当前排序状态) */}
                <View className="flex-row justify-end mt-1">
                    {isNearby ? (
                        // 如果是 Nearby 模式，显示 "Sorted by Distance" 提示
                        <View className="flex-row items-center bg-white/20 px-3 py-1.5 rounded-xl border border-white/10">
                            <Ionicons name="navigate-circle" size={14} color="#FEF3C7" style={{ marginRight: 4 }} />
                            <Text className="text-purple-50 text-xs font-bold">Nearest First</Text>
                        </View>
                    ) : (
                        // 否则显示时间排序按钮
                        <TouchableOpacity
                            onPress={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                            className="flex-row items-center bg-black/10 px-3 py-1.5 rounded-xl border border-white/10"
                        >
                            <Text className="text-purple-50 text-xs font-bold mr-1">
                                {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                            </Text>
                            <Ionicons name={sortOrder === 'newest' ? "arrow-down" : "arrow-up"} size={12} color="#FEF3C7" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter Area */}
            <View className="bg-white pb-2">
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10, gap: 8 }}>
                    <View className="mr-2 justify-center"><Ionicons name="location-sharp" size={16} color="#9ca3af" /></View>

                    {/* Nearby Button */}
                    <TouchableOpacity
                        onPress={handleToggleNearby}
                        className={`px-3 py-1.5 rounded-full border flex-row items-center ${isNearby ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-100'}`}
                    >
                        <Ionicons name="navigate" size={12} color={isNearby ? "white" : "#4B5563"} style={{ marginRight: 4 }} />
                        <Text className={`text-xs font-bold ${isNearby ? 'text-white' : 'text-gray-600'}`}>Nearby</Text>
                    </TouchableOpacity>

                    {/* Cities */}
                    {CITIES.map(city => (
                        <TouchableOpacity
                            key={city}
                            onPress={() => {
                                setIsNearby(false);
                                setCityFilter(city);
                            }}
                            className={`px-3 py-1.5 rounded-full border ${!isNearby && cityFilter === city ? 'bg-purple-50 border-purple-500' : 'bg-white border-gray-100'}`}
                        >
                            <Text className={`text-xs font-bold ${!isNearby && cityFilter === city ? 'text-purple-700' : 'text-gray-500'}`}>{city}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Categories */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 8 }}>
                    <View className="mr-2 justify-center"><Ionicons name="grid" size={16} color="#9ca3af" /></View>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setCategoryFilter(cat)}
                            className={`px-3 py-1.5 rounded-full border ${categoryFilter === cat ? 'bg-gray-800 border-gray-800' : 'bg-white border-gray-100'}`}
                        >
                            <Text className={`text-xs font-bold ${categoryFilter === cat ? 'text-white' : 'text-gray-500'}`}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Content */}
            {displayPosts.length === 0 ? (
                <ScrollView
                    contentContainerStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9333ea" />}
                >
                    <MaterialCommunityIcons name="map-search-outline" size={80} color="#e5e7eb" />
                    <Text className="text-gray-400 mt-4 font-pmedium text-lg">No items match your filters.</Text>
                    {(cityFilter !== 'All' || categoryFilter !== 'All' || isNearby) && (
                        <TouchableOpacity onPress={() => { setCityFilter('All'); setCategoryFilter('All'); setIsNearby(false); }} className="mt-6 bg-white border border-gray-100 px-6 py-3 rounded-full">
                            <Text className="text-purple-600 font-bold">Clear Filters</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            ) : (
                <FlatList
                    data={displayPosts}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9333ea" />}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => router.push({ pathname: `/community/[id]`, params: { id: item._id } })}
                            className="bg-white rounded-3xl p-4 mb-4  flex-row"
                        >
                            <View className="w-24 h-24 bg-gray-50 rounded-2xl mr-4 overflow-hidden items-center justify-center">
                                {item.imageUrl ? (
                                    <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                                ) : (
                                    <MaterialCommunityIcons name="food-variant" size={40} color="#cbd5e1" />
                                )}
                            </View>

                            <View className="flex-1 justify-between py-1">
                                <View>
                                    <View className="flex-row justify-between">
                                        <Text className="text-lg font-pbold text-gray-800 flex-1 mr-2" numberOfLines={1}>{item.name}</Text>
                                        <Text className="text-[10px] text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                    <View className="flex-row items-center mt-1">
                                        <Ionicons name="location-sharp" size={12} color={isNearby ? "#16a34a" : "#9ca3af"} />
                                        <Text className="text-xs ml-1 text-gray-500 numberOfLines={1}">
                                            {/* 如果是 Nearby 模式，高亮显示距离 */}
                                            {item.distance
                                                ? `${item.distance} km away`
                                                : `${item.location?.city || 'Unknown'} • ${item.location?.district || ''}`
                                            }
                                        </Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between mt-2">
                                    <View className="flex-row items-center">
                                        {item.postedBy._id === userInfo?._id ? (
                                            <View className="bg-purple-100 px-2 py-0.5 rounded-md mr-2">
                                                <Text className="text-purple-700 text-[10px] font-bold">ME</Text>
                                            </View>
                                        ) : (
                                            <Text className="text-xs text-gray-400 font-medium mr-2">by {item.postedBy.name}</Text>
                                        )}
                                    </View>
                                    <StatusBadge status={item.status} />
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}