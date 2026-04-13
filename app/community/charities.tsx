import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Linking,
    Platform,
    RefreshControl,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Charity, communityApi } from "../../api/community";
import { translations } from "@/i18n/translations";
import { useUserStore } from "@/store/userStore";
import Toast from "react-native-toast-message";

export default function CharitiesFeed() {
    const router = useRouter();
    const [charities, setCharities] = useState<Charity[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { language } = useUserStore();
    const t = translations[language];

    useEffect(() => {
        fetchCharities();
    }, []);

    const fetchCharities = async () => {
        try {
            const data = await communityApi.getCharities();
            setCharities(data);
        } catch (error) {
            console.error("Failed to load charities");
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.loadCharitiesError
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchCharities();
    };

    // 📞 联系慈善机构逻辑
    const handleContactCharity = (charity: Charity) => {
        Alert.alert(
            `Contact ${charity.name}`,
            t.contactCharityPrompt,
            [
                { text: t.cancel, style: "cancel" },
                {
                    text: t.call,
                    onPress: () => Linking.openURL(`tel:${charity.contact.replace(/\D/g, '')}`)
                },
                {
                    text: t.whatsapp,
                    onPress: async () => {
                        const cleanPhone = charity.contact.replace(/\D/g, '');
                        const msg = encodeURIComponent(t.donateMessage);
                        const whatsappUrl = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
                        const smsUrl = `sms:${cleanPhone}${Platform.OS === 'ios' ? '&' : '?'}body=${msg}`;

                        try {
                            const canOpenWA = await Linking.canOpenURL(whatsappUrl);
                            if (canOpenWA) {
                                await Linking.openURL(whatsappUrl);
                            } else {
                                await Linking.openURL(smsUrl);
                            }
                        } catch (error) {
                            Toast.show({ type: 'error', text1: t.cannotOpenApp });
                        }
                    }
                }
            ]
        );
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
            <View className="bg-purple-600 pt-16 pb-8 px-6 rounded-b-[35px] shadow-xl shadow-purple-100 relative overflow-hidden">
                {/* 装饰背景圆圈 */}
                <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full" />

                <View className="flex-row justify-between items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md border border-white/30"
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                    </TouchableOpacity>

                    <Text className="text-white text-xl font-pbold">{t.charitiesTitle}</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={charities}
                keyExtractor={item => item._id}
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#9333ea" />}
                ListHeaderComponent={
                    <View className="mb-6 bg-purple-50 p-5 rounded-[24px] border border-purple-100 flex-row items-center shadow-sm mt-4">
                        <MaterialCommunityIcons name="hand-heart" size={32} color="#9333ea" />
                        <Text className="text-purple-800 font-pmedium ml-4 flex-1 text-sm leading-5">
                            {t.charitiesInfoBanner}
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View className="items-center mt-20">
                        <MaterialCommunityIcons name="home-heart" size={80} color="#e5e7eb" />
                        <Text className="text-gray-400 mt-4 font-pmedium text-lg">{t.noCharitiesYet}</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="bg-white rounded-[32px] mb-5 shadow-sm border border-gray-100 overflow-hidden">
                        {/* Image Banner */}
                        <View className="w-full h-40 bg-gray-200 relative">
                            {item.imageUrl ? (
                                <Image source={{ uri: item.imageUrl }} className="w-full h-full" resizeMode="cover" />
                            ) : (
                                <View className="w-full h-full items-center justify-center bg-purple-100">
                                    <MaterialCommunityIcons name="home-heart" size={60} color="#d8b4fe" />
                                </View>
                            )}
                            {/* Overlay Gradient */}
                            <View className="absolute inset-0 bg-black/30" />

                            {/* Title & Verified Badge */}
                            <View className="absolute bottom-4 left-5 flex-row items-center pr-4">
                                {item.verified && (
                                    <MaterialCommunityIcons name="check-decagram" size={20} color="#38BDF8" style={{ marginRight: 6 }} />
                                )}
                                <Text className="text-white font-pbold text-2xl drop-shadow-md" numberOfLines={1}>
                                    {item.name}
                                </Text>
                            </View>
                        </View>

                        <View className="p-6">
                            <Text className="text-gray-600 text-sm leading-6 mb-5 font-pregular">
                                {item.description[language.toLowerCase() as keyof typeof item.description] as string}
                            </Text>

                            <View className="flex-row items-center mb-3">
                                <View className="bg-purple-50 w-8 h-8 rounded-full items-center justify-center mr-3">
                                    <Ionicons name="location" size={16} color="#9333ea" />
                                </View>
                                <Text className="text-gray-700 text-sm font-pmedium flex-1"> {t.cities[item.city as keyof typeof t.cities] || item.city} • {item.address}</Text>
                            </View>

                            <View className="flex-row items-start mb-6">
                                <View className="bg-purple-50 w-8 h-8 rounded-full items-center justify-center mr-3 mt-1">
                                    <Ionicons name="basket" size={16} color="#9333ea" />
                                </View>
                                <View className="flex-1 flex-row flex-wrap gap-2 pt-1">
                                    {item.needs.map(need => (
                                        <View key={need} className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                                            <Text className="text-[11px] font-pbold text-gray-500 uppercase tracking-wide">  {t.needsMap[need as keyof typeof t.needsMap] || need}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View className="flex-row gap-3 pt-5 border-t border-gray-100">
                                <TouchableOpacity
                                    onPress={() => {
                                        if (item.website && item.website.startsWith('http')) {
                                            Linking.openURL(item.website).catch(() => Alert.alert(t.detailError, t.cannotOpenWebsite));
                                        } else {
                                            Alert.alert("Info", t.websiteNotAvailable);
                                        }
                                    }}
                                    className="flex-1 bg-gray-50 py-4 rounded-2xl items-center border border-gray-200"
                                >
                                    <Text className="text-gray-600 font-bold text-sm">{t.websiteBtn}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => handleContactCharity(item)}
                                    className="flex-[2] bg-purple-600 py-4 rounded-2xl flex-row justify-center items-center shadow-lg shadow-purple-200"
                                >
                                    <Ionicons name="heart" size={18} color="white" />
                                    <Text className="text-white font-bold text-base ml-2">{t.donateNowBtn}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    );
}