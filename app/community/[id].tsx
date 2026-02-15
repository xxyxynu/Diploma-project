import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Image,
    Linking,
    Platform,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Circle, Marker } from "react-native-maps"; // 📦 New Import
import { communityApi, CommunityPost } from "../../api/community";
import { useUserStore } from "../../store/userStore";

const { width } = Dimensions.get('window');

export default function CommunityDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { userInfo } = useUserStore();
    const [post, setPost] = useState<CommunityPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => { fetchDetail(); }, [id]);

    const fetchDetail = async () => {
        try {
            const data = await communityApi.getOne(id as string);
            setPost(data);
        } catch (error) {
            Alert.alert("Error", "Could not load post");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async () => {
        if (!post) return;
        await Clipboard.setStringAsync(post.contact);
        Alert.alert("Copied", "Phone number copied!");
    };

    const handleContact = () => {
        if (!post) return;
        const message = `Hi ${post.postedBy.name}! I'm interested in "${post.name}". Is it available?`;
        const cleanPhone = post.contact.replace(/\D/g, '');
        const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        Linking.openURL(url).catch(() => {
            const smsUrl = `sms:${cleanPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${encodeURIComponent(message)}`;
            Linking.openURL(smsUrl);
        });
    };

    // 🆕 Reservation Logic
    const handleReserve = async () => {
        Alert.alert("Reserve Item", "Notify the owner that you want to pick this up?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Yes, Request",
                onPress: async () => {
                    setActionLoading(true);
                    try {
                        await communityApi.createReservation(post!._id, "I'd like to pick this up!");
                        // Refresh post to show updated status
                        fetchDetail();
                        Alert.alert("Requested!", "Owner has been notified.");
                    } catch (error) {
                        Alert.alert("Error", "Failed to reserve item");
                    } finally {
                        setActionLoading(false);
                    }
                }
            }
        ]);
    };

    const handleUpdateStatus = async (status: 'available' | 'reserved' | 'taken') => {
        setActionLoading(true);
        try {
            await communityApi.updateStatus(post!._id, status);
            fetchDetail();
        } catch (error) {
            Alert.alert("Error", "Failed to update status");
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert("Delete Post", "Are you sure?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete", style: 'destructive', onPress: async () => {
                    await communityApi.delete(post!._id);
                    router.replace("/community");
                }
            }
        ]);
    };

    const handleOpenMap = () => {
        if (!post) return;

        // 获取坐标 (如果没有精确坐标，就用模糊坐标)
        // 注意：数据结构要确保正确
        const coords = post.location.exactCoords || post.location.approximateCoords;

        if (!coords) {
            Alert.alert("Error", "No coordinates available");
            return;
        }

        const { latitude, longitude } = coords;

        // ⚠️ 关键点：2GIS 深度链接通常期望顺序是 [longitude, latitude] (经度, 纬度)
        // 格式：dgis://2gis.ru/geo/{lon},{lat}
        const appUrl = `dgis://2gis.ru/geo/${longitude},${latitude}`;

        // 网页版备用
        const webUrl = `https://2gis.kz/geo/${longitude},${latitude}`;

        Linking.canOpenURL(appUrl).then(supported => {
            if (supported) {
                return Linking.openURL(appUrl);
            } else {
                return Linking.openURL(webUrl);
            }
        }).catch(() => {
            // 最后的回退方案：直接搜文字描述
            const query = encodeURIComponent(`${post.location.city}, ${post.location.publicDescription}`);
            Linking.openURL(`https://2gis.kz/search/${query}`);
        });
    };

    if (loading || !post) return <View className="flex-1 justify-center bg-white"><ActivityIndicator color="#F59E0B" /></View>;

    const isOwner = post.postedBy._id === userInfo?._id;
    const isTaken = post.status === 'taken';
    const locationCoords = post.location.approximateCoords;

    return (
        <View className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />

            {/* Header Image */}
            <View className="h-72 w-full bg-gray-100 relative">
                {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} className="w-full h-full" resizeMode="cover" />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-purple-50">
                        <MaterialCommunityIcons name="image-off-outline" size={60} color="#FCD34D" />
                    </View>
                )}
                <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-6 bg-black/30 backdrop-blur-md w-10 h-10 rounded-full items-center justify-center">
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>

                {/* Status Badge on Image */}
                <View className="absolute bottom-10 right-6 px-3 py-1.5 rounded-lg bg-white/90 backdrop-blur-md shadow-sm">
                    <Text className={`font-bold text-xs uppercase ${isTaken ? 'text-gray-500' : 'text-green-600'}`}>
                        {post.status}
                    </Text>
                </View>
            </View>

            <ScrollView className="-mt-8 flex-1 bg-white rounded-t-[35px]" contentContainerStyle={{ paddingBottom: 120 }}>
                <View className="pt-8 px-6">

                    {/* Title & Tags */}
                    <Text className="text-3xl font-pbold text-slate-900 leading-tight mb-3">{post.name}</Text>
                    <View className="flex-row flex-wrap gap-2 mb-6">
                        {post.tags.map(tag => (
                            <View key={tag} className="bg-gray-100 px-3 py-1 rounded-full">
                                <Text className="text-gray-500 font-bold text-xs">{tag}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Owner Info */}
                    <View className="flex-row items-center mb-8 border-b border-gray-100 pb-6">
                        <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center mr-3">
                            <Text className="text-purple-600 font-bold text-lg">{post.postedBy.name[0]}</Text>
                        </View>
                        <View>
                            <Text className="text-sm text-gray-500">Shared by</Text>
                            <Text className="font-pbold text-slate-800 text-base">{isOwner ? "You" : post.postedBy.name}</Text>
                        </View>
                    </View>

                    {/* 🗺️ Location Map Section (可点击跳转) */}
                    <Text className="text-slate-900 font-pbold text-lg mb-3">Location</Text>

                    {/* 把地图包在 TouchableOpacity 里，点击直接触发导航 */}
                    <TouchableOpacity
                        onPress={handleOpenMap}
                        activeOpacity={0.9}
                        className="h-48 w-full rounded-2xl overflow-hidden mb-4 bg-gray-100 border border-gray-200 relative"
                    >
                        <MapView
                            style={{ flex: 1 }}
                            initialRegion={{
                                latitude: locationCoords.latitude,
                                longitude: locationCoords.longitude,
                                latitudeDelta: 0.01, // 稍微放大一点
                                longitudeDelta: 0.01,
                            }}
                            scrollEnabled={false} // 禁止滑动，防止误触，想看详情点击跳转
                            zoomEnabled={false}
                            pitchEnabled={false}
                        >
                            {/* 隐私圈 */}
                            <Circle
                                center={locationCoords}
                                radius={300} // 300米范围
                                strokeColor="rgba(245, 158, 11, 0.8)" // Amber stroke
                                fillColor="rgba(245, 158, 11, 0.2)"   // Amber fill
                            />
                            {/* 中心标记 (显示大概位置中心) */}
                            <Marker coordinate={locationCoords} opacity={0.5} />
                        </MapView>

                        {/* 地图上的覆盖按钮，提示用户可以点击 */}
                        <View className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg flex-row items-center shadow-sm">
                            <Text className="text-xs font-bold text-purple-600 mr-1">Open in 2GIS</Text>
                            <MaterialCommunityIcons name="map-marker-radius" size={14} color="#7C3AED" />
                        </View>
                    </TouchableOpacity>

                    {/* 地址详情卡片 */}
                    <View className="bg-purple-50 p-4 rounded-xl mb-8 border border-purple-100">
                        <View className="flex-row items-start">
                            <Ionicons name="location" size={20} color="#7C3AED" style={{ marginTop: 2 }} />
                            <View className="ml-3 flex-1">
                                {/* 1. 公共描述 (最重要，例如 "Near Dostyk Plaza") */}
                                <Text className="text-purple-900 font-bold text-lg leading-6">
                                    {post.location.publicDescription || "No location description"}
                                </Text>

                                {/* 2. 城市与区域 */}
                                <Text className="text-purple-800/70 text-sm mt-1">
                                    {post.location.city}
                                    {post.location.district ? ` • ${post.location.district}` : ''}
                                </Text>

                                {/* 3. 精确地址 (只有发布者可见，或者已确认状态可见) */}
                                {(isOwner && post.location.exactAddress) && (
                                    <View className="mt-3 pt-3 border-t border-purple-200/60">
                                        <Text className="text-purple-900 text-xs font-bold uppercase mb-1">
                                            Exact Address (Only you see this):
                                        </Text>
                                        <Text className="text-purple-900 font-medium">
                                            {post.location.exactAddress}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Description */}
                    <Text className="text-slate-900 font-pbold text-lg mb-3">Description</Text>
                    <Text className="text-gray-600 leading-7 text-base mb-8">{post.description}</Text>

                    {/* Contact (Read Only) */}
                    {!isOwner && (
                        <View className="flex-row items-center justify-between bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="call" size={18} color="#4B5563" />
                                <Text className="ml-3 text-lg font-semibold text-gray-800">{post.contact}</Text>
                            </View>
                            <TouchableOpacity onPress={handleCopy} className="px-1 py-1">
                                <Ionicons name="copy-outline" size={18} color="#4B5563" />
                            </TouchableOpacity>
                        </View>
                    )}

                </View>
            </ScrollView>

            {/* Bottom Actions */}
            <View className="absolute bottom-0 w-full bg-white px-6 pt-4 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] rounded-t-[20px]">
                {isOwner ? (
                    <View className="flex-row gap-3">
                        <TouchableOpacity onPress={handleDelete} className="flex-1 bg-gray-50 py-4 rounded-2xl items-center border border-gray-100">
                            <Ionicons name="trash-outline" size={20} color="gray" />
                        </TouchableOpacity>

                        {post.status !== 'taken' ? (
                            <TouchableOpacity onPress={() => handleUpdateStatus('taken')} className="flex-[2] bg-slate-800 py-4 rounded-2xl items-center">
                                <Text className="text-white font-bold text-lg">Mark as Taken</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => handleUpdateStatus('available')} className="flex-[2] bg-green-600 py-4 rounded-2xl items-center">
                                <Text className="text-white font-bold text-lg">Relist Item</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View className="flex-row gap-3">
                        {/* 🆕 Request / Reserve Button */}
                        {post.status === 'available' ? (
                            <TouchableOpacity
                                onPress={handleReserve}
                                disabled={actionLoading}
                                className="flex-1 bg-gray-100 py-4 rounded-2xl items-center justify-center"
                            >
                                {actionLoading ? <ActivityIndicator size="small" color="black" /> : <Text className="text-gray-800 font-bold text-lg">Request</Text>}
                            </TouchableOpacity>
                        ) : (
                            <View className="flex-1 bg-gray-100 py-4 rounded-2xl items-center justify-center opacity-50">
                                <Text className="text-gray-500 font-bold">{post.status.toUpperCase()}</Text>
                            </View>
                        )}

                        {/* Contact Button */}
                        <TouchableOpacity onPress={handleContact} className="flex-[2] bg-purple-500 py-4 rounded-2xl flex-row items-center justify-center">
                            <Ionicons name="chatbubble-ellipses" size={22} color="white" />
                            <Text className="text-white font-bold text-lg ml-2">Contact</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}