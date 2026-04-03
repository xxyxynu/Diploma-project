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
import MapView, { Circle, Marker } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";
import { communityApi, CommunityPost } from "../../api/community";
import { useUserStore } from "../../store/userStore";

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

    //Reservation Logic
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

        // 关键点：2GIS 深度链接通常期望顺序是 [longitude, latitude] (经度, 纬度)
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

            {/* Header Section: 增加阴影和更高级的模糊效果 */}
            <View className="h-80 w-full relative">
                {post.imageUrl ? (
                    <Image source={{ uri: post.imageUrl }} className="w-full h-full" resizeMode="contain" />
                ) : (
                    <View className="w-full h-full items-center justify-center bg-purple-50">
                        <MaterialCommunityIcons name="food-variant" size={80} color="#DDD6FE" />
                    </View>
                )}

                {/* 顶部渐变遮罩：确保返回按钮清晰 */}
                <LinearGradient
                    colors={['rgba(0,0,0,0.4)', 'transparent']}
                    className="absolute top-0 left-0 right-0 h-24"
                />

                <TouchableOpacity
                    onPress={() => router.back()}
                    className="absolute top-12 left-6 bg-white/20 backdrop-blur-xl w-12 h-12 rounded-2xl items-center justify-center border border-white/30"
                >
                    <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>

                {/* 悬浮的状态标签：右下角，更有设计感 */}
                <View className={`absolute bottom-12 right-6 px-4 py-2 rounded-2xl backdrop-blur-md shadow-lg ${isTaken ? 'bg-gray-100/90' : 'bg-green-500/90'}`}>
                    <Text className={`font-pbold text-xs uppercase tracking-widest ${isTaken ? 'text-gray-500' : 'text-white'}`}>
                        {post.status}
                    </Text>
                </View>
            </View>

            {/* 内容主体：向上偏移覆盖图片 */}
            <ScrollView
                className="-mt-10 flex-1 bg-white rounded-t-[40px] shadow-2xl"
                contentContainerStyle={{ paddingBottom: 140 }}
                showsVerticalScrollIndicator={false}
            >
                <View className="px-8 pt-10">
                    {/* 1. 标题与标签 */}
                    <View className="mb-6">
                        <Text className="text-3xl font-pbold text-slate-900 leading-tight mb-4">{post.name}</Text>
                        <View className="flex-row flex-wrap gap-2">
                            {post.tags.map(tag => (
                                <View key={tag} className="bg-purple-50 px-4 py-1.5 rounded-xl border border-purple-100">
                                    <Text className="text-purple-600 font-psemibold text-xs">{tag}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* 2. 发布者小卡片：增加信任感 */}
                    <View className="flex-row items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 mb-8">
                        <View className="w-14 h-14 bg-white rounded-2xl items-center justify-center mr-4 border border-slate-100">
                            <Image
                                source={{ uri: `https://api.dicebear.com/9.x/avataaars/png?seed=${post.postedBy.name}` }}
                                className="w-12 h-12 rounded-xl"
                            />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-xs font-pmedium">Donated by</Text>
                            <Text className="font-pbold text-slate-800 text-lg">{isOwner ? "You" : post.postedBy.name}</Text>
                        </View>
                        {!isOwner && (
                            <View className="bg-green-100 px-3 py-1 rounded-lg">
                                <Text className="text-green-700 text-[10px] font-pbold uppercase">Verified</Text>
                            </View>
                        )}
                    </View>

                    {/* 3. 描述部分 */}
                    <View className="mb-8">
                        <View className="flex-row items-center mb-3">
                            <MaterialCommunityIcons name="text-box" size={20} color="#6366f1" />
                            <Text className="text-slate-900 font-pbold text-lg ml-2">Story</Text>
                        </View>
                        <Text className="text-slate-500 leading-7 text-base font-pregular bg-indigo-50/30 p-4 rounded-2xl italic">
                            "{post.description}"
                        </Text>
                    </View>

                    {/* 5. Contact Info Block */}
                    <Text className="text-slate-900 font-pbold text-lg mb-3">Contact Provider</Text>
                    <TouchableOpacity
                        onPress={handleCopy}
                        activeOpacity={0.7}
                        className="bg-slate-50 px-3 py-5 rounded-[28px] border border-slate-100 flex-row items-center justify-between mb-8"
                    >
                        <View className="flex-row items-center flex-1">
                            <View className="bg-white w-12 h-12 rounded-2xl items-center justify-center border border-slate-100 mr-4">
                                <Ionicons name="call" size={20} color="#6366f1" />
                            </View>
                            <View>
                                <Text className="text-slate-400 text-[10px] font-pbold uppercase mb-0.5">Phone Number</Text>
                                <Text className="text-slate-900 font-pbold text-base">{post.contact}</Text>
                            </View>
                        </View>

                        {/* 复制按钮提示 */}
                        <View className="px-2 py-2 rounded-xl">
                            <Ionicons name="copy-outline" size={18} color="#6366f1" />
                        </View>
                    </TouchableOpacity>

                    {/* 4. 地图与位置：增加内阴影感 */}
                    <View className="mb-8">
                        <View className="flex-row justify-between items-center mb-4">
                            <View className="flex-row items-center">
                                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#ef4444" />
                                <Text className="text-slate-900 font-pbold text-lg ml-2">Pickup Location</Text>
                            </View>
                            <TouchableOpacity onPress={handleOpenMap}>
                                <Text className="text-primary font-pbold text-xs uppercase">Get Directions</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleOpenMap}
                            activeOpacity={0.9}
                            className="h-56 w-full rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-md relative"
                        >
                            <MapView
                                style={{ flex: 1 }}
                                initialRegion={{
                                    latitude: locationCoords.latitude,
                                    longitude: locationCoords.longitude,
                                    latitudeDelta: 0.01,
                                    longitudeDelta: 0.01,
                                }}
                                scrollEnabled={false}
                                zoomEnabled={false}
                                pitchEnabled={false}
                            >
                                <Circle
                                    center={locationCoords}
                                    radius={300}
                                    strokeColor="rgba(99, 102, 241, 0.5)"
                                    fillColor="rgba(99, 102, 241, 0.15)"
                                />
                                <Marker coordinate={locationCoords}>
                                    <View className="bg-white p-2 rounded-full shadow-lg border border-purple-100">
                                        <MaterialCommunityIcons name="food-apple" size={20} color="#7C3AED" />
                                    </View>
                                </Marker>
                            </MapView>

                            {/* 浮动地址信息块 */}
                            <View className="absolute bottom-4 left-4 right-4 bg-white/95 p-4 rounded-2xl shadow-xl flex-row items-center">
                                <View className="bg-purple-100 p-2 rounded-xl mr-3">
                                    <Ionicons name="location" size={18} color="#7C3AED" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 font-pbold text-sm" numberOfLines={1}>
                                        {post.location.publicDescription}
                                    </Text>
                                    <Text className="text-slate-400 text-[10px] font-pmedium">
                                        {post.location.city} • {post.location.district || 'Nearby'}
                                    </Text>
                                </View>
                            </View>

                        </TouchableOpacity>

                    </View>
                </View>
            </ScrollView>

            {/* Bottom Floating Bar */}
            <View className="absolute bottom-0 w-full bg-white/80 backdrop-blur-xl px-8 pt-4 pb-10 border-t border-slate-100">
                {isOwner ? (
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={handleDelete}
                            className="w-16 h-16 bg-red-50 rounded-3xl items-center justify-center border border-red-100 active:bg-red-100"
                        >
                            <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => handleUpdateStatus(isTaken ? 'available' : 'taken')}
                            className={`flex-1 h-16 rounded-3xl items-center justify-center shadow-lg ${isTaken ? 'bg-green-600 shadow-green-200' : 'bg-slate-900 shadow-slate-300'}`}
                        >
                            <Text className="text-white font-pbold text-lg">
                                {isTaken ? "Relist Now" : "Mark as Taken"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View className="flex-row gap-4">
                        <TouchableOpacity
                            onPress={handleReserve}
                            disabled={isTaken}
                            className={`flex-1 h-16 rounded-3xl items-center justify-center border-2 ${isTaken ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'}`}
                        >
                            <Text className={`font-pbold text-lg ${isTaken ? 'text-slate-300' : 'text-slate-800'}`}>Request</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleContact}
                            disabled={isTaken}
                            className={`flex-1 h-16 rounded-3xl flex-row items-center justify-center shadow-xl ${isTaken ? 'bg-slate-200 shadow-none' : 'bg-purple-600 shadow-purple-200'}`}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                            <Text className="text-white font-pbold text-lg ml-2">Chat</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}