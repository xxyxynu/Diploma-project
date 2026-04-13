import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { communityApi } from "../../api/community";
import { foodApi, FridgeItem } from "../../api/food";
import { LocationPicker } from "../../components/LocationPicker";
import { useFridgeStore } from "../../store/fridgeStore";
import { translations } from "@/i18n/translations";
import { useUserStore } from "@/store/userStore";
import { useNetworkStore } from "@/store/networkStore";
import Toast from "react-native-toast-message";

const TAGS = ['Fruit', 'Vegetables', 'Bakery', 'Canned', 'Cooked', 'Other'];

export default function CreateShare() {
    const router = useRouter();
    const { selectedFridge } = useFridgeStore();
    const { language } = useUserStore();
    const t = translations[language];
    const { isConnected } = useNetworkStore();

    const [loading, setLoading] = useState(false);
    const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // Form Data
    const [name, setName] = useState("");
    const [desc, setDesc] = useState("");
    const [contact, setContact] = useState("+7 ");
    const [selectedTag, setSelectedTag] = useState("Other");
    const [imageBase64, setImageBase64] = useState<string | null>(null);

    // Location Data
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [locationData, setLocationData] = useState<{
        city: string;
        district?: string;
        publicDescription: string;
        exactAddress?: string;
        latitude: number;
        longitude: number;
    } | null>(null);

    useEffect(() => {
        if (selectedFridge) loadFridgeItems();
    }, [selectedFridge]);

    const loadFridgeItems = async () => {
        try {
            const items = await foodApi.getAll(selectedFridge!._id);
            setFridgeItems(items.filter(i => i.status !== 'expired'));
        } catch (e) { console.error(e); }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            setImageBase64(`data:image/jpeg;base64,${result.assets[0].base64}`);
        }
    };

    const handlePhoneChange = (text: string) => {
        let cleaned = text.replace(/\D/g, '');
        if (cleaned.startsWith('8')) cleaned = '7' + cleaned.slice(1);
        if (!cleaned.startsWith('7')) cleaned = '7' + cleaned;
        cleaned = cleaned.slice(0, 11);

        let formatted = '+7 ';
        if (cleaned.length > 1) formatted += '(' + cleaned.slice(1, 4);
        if (cleaned.length >= 4) formatted += ') ' + cleaned.slice(4, 7);
        if (cleaned.length >= 7) formatted += '-' + cleaned.slice(7, 9);
        if (cleaned.length >= 9) formatted += '-' + cleaned.slice(9, 11);
        setContact(formatted);
    };

    const toggleSelection = (item: FridgeItem) => {
        const newIds = selectedIds.includes(item._id)
            ? selectedIds.filter(id => id !== item._id)
            : [...selectedIds, item._id];
        setSelectedIds(newIds);

        if (newIds.length === 0) { setName(""); setDesc(""); return; }

        const selected = fridgeItems.filter(i => newIds.includes(i._id));
        const titleNames = selected.map(i => i.name).join(", ");
        setName(selected.length > 1 ? `${t.bundleTitle} ${titleNames}`.slice(0, 50) : titleNames);

        const detailDesc = selected.map(i =>
            `- ${i.name} (${i.quantity} ${i.unit}), ${t.expires} ${new Date(i.expiryDate).toLocaleDateString()}` // 🌍 翻译 Exp:
        ).join("\n");

        setDesc(`${t.sharingTheseItems}\n${detailDesc}\n\n${t.pickUpDetailsBelow}`);
    };

    const handlePost = async () => {
        if (!isConnected) {
            Toast.show({
                type: 'error',
                text1: t.missingInfo || "Offline",
                text2: "Please check your internet connection."
            });
            return;
        }

        if (!name || !desc || contact.length < 18) {
            Toast.show({
                type: 'error',
                text1: t.missingInfo,
                text2: t.fillRequiredFields
            });
            return;
        }

        // Validate location
        if (!locationData) {
            Toast.show({
                type: 'info',
                text1: t.missingLocation,
                text2: t.selectPickupLocation
            });
            return;
        }

        setLoading(true);
        try {
            await communityApi.create({
                name,
                description: desc,
                contact,
                tags: [selectedTag],
                imageUrl: imageBase64 || undefined,
                city: locationData.city,
                district: locationData.district,
                publicLocation: locationData.publicDescription,
                exactAddress: locationData.exactAddress,
                latitude: locationData.latitude,
                longitude: locationData.longitude
            });

            Toast.show({
                type: 'success',
                text1: t.postSuccess,
                text2: name
            });

            if (selectedIds.length > 0) {
                Alert.alert(t.postSuccess, t.itemSharedPrompt, [
                    { text: t.keepInFridge, onPress: () => router.back() },
                    {
                        text: t.removeFromFridge, style: 'destructive', onPress: async () => {
                            await Promise.all(selectedIds.map(id => foodApi.delete(id)));
                            router.back();
                        }
                    }
                ]);
            } else {
                router.back();
            }
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.failedToPost
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
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

                    <Text className="text-white text-xl font-pbold">{t.shareFood}</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 50 }}>
                {/* Fridge Selection */}
                <Text className="text-gray-700 font-pbold mb-3">{t.selectFromFridge}</Text>
                <FlatList
                    horizontal data={fridgeItems} keyExtractor={i => i._id} showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            onPress={() => toggleSelection(item)}
                            className={`mr-3 p-3 rounded-xl border ${selectedIds.includes(item._id) ? 'bg-purple-50 border-purple-600' : 'border-gray-100'
                                }`}
                        >
                            <MaterialCommunityIcons
                                name="food"
                                size={24}
                                color={selectedIds.includes(item._id) ? "#9333ea" : "#cbd5e1"}
                            />
                            <Text className="text-xs mt-1 font-pmedium">{item.name}</Text>
                        </TouchableOpacity>
                    )}
                />

                <View className="h-[1px] bg-gray-100 my-6" />

                {/* Photo */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full h-48 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mb-6 overflow-hidden"
                >
                    {imageBase64 ? (
                        <Image source={{ uri: imageBase64 }} className="w-full h-full" resizeMode="cover" />
                    ) : (
                        <View className="items-center">
                            <Ionicons name="camera" size={32} color="#9CA3AF" />
                            <Text className="text-gray-400 mt-2">{t.addCoverPhoto}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Fields */}
                <Input label={t.titleLabel} value={name} onChangeText={setName} />
                <Input label={t.descriptionLabel} value={desc} onChangeText={setDesc} multiline />

                {/* Location Picker Button */}
                <Text className="text-gray-700 font-pmedium mb-2">{t.locationLabel}</Text>
                <TouchableOpacity
                    onPress={() => setShowLocationPicker(true)}
                    className={`flex-row items-center justify-between p-4 rounded-xl border-2 mb-4 ${locationData
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-gray-50 border-dashed border-gray-300'
                        }`}
                >
                    <View className="flex-1">
                        {locationData ? (
                            <>
                                <Text className="text-purple-900 font-pbold">
                                    {locationData.publicDescription}
                                </Text>
                                <Text className="text-purple-600 text-xs mt-1">
                                    {locationData.city}{locationData.district ? ` • ${locationData.district}` : ''}
                                </Text>
                            </>
                        ) : (
                            <Text className="text-gray-400">{t.tapToSelectLocation}</Text>
                        )}
                    </View>
                    <Ionicons
                        name={locationData ? "checkmark-circle" : "location"}
                        size={24}
                        color={locationData ? "#9333ea" : "#9CA3AF"}
                    />
                </TouchableOpacity>

                <Input
                    label={t.phoneLabel}
                    value={contact}
                    onChangeText={handlePhoneChange}
                    placeholder="+7 (XXX) XXX-XX-XX"
                    keyboardType="number-pad"
                />

                {/* Category Tags */}
                <Text className="text-gray-700 font-pmedium mb-2">{t.categoryLabel}</Text>
                <View className="flex-row flex-wrap gap-2 mb-4">
                    {TAGS.map(tag => (
                        <TouchableOpacity
                            key={tag}
                            onPress={() => setSelectedTag(tag)}
                            className={`px-3 py-2 rounded-full border ${selectedTag === tag
                                ? 'bg-gray-800 border-gray-800'
                                : 'border-gray-200'
                                }`}
                        >
                            <Text className={selectedTag === tag ? 'text-white font-bold text-xs' : 'text-gray-500 text-xs'}>
                                {t.categories ? (t.categories[tag as keyof typeof t.categories] || tag) : tag}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    onPress={handlePost}
                    disabled={loading}
                    className="bg-purple-500 py-4 rounded-2xl items-center mt-4"
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-pbold text-lg">{t.postBtn}</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {/* Location Picker Modal */}
            <LocationPicker
                visible={showLocationPicker}
                onClose={() => setShowLocationPicker(false)}
                onSelect={setLocationData}
                initialCity={locationData?.city}
            />
        </View>
    );
}

const Input = ({ label, multiline, ...props }: any) => (
    <View className="mb-4">
        <Text className="text-gray-700 font-pmedium mb-2">{label}</Text>
        <TextInput
            className={`bg-gray-100 px-4 py-3 rounded-xl font-pregular ${multiline ? 'h-24' : ''}`}
            textAlignVertical={multiline ? 'top' : 'center'}
            {...props}
        />
    </View>
);