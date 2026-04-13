import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Circle, Marker } from 'react-native-maps';
import { useUserStore } from "../store/userStore";
import { translations } from "../i18n/translations";
import Toast from "react-native-toast-message";

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (location: {
        city: string;
        district?: string;
        publicDescription: string;
        exactAddress?: string;
        latitude: number;
        longitude: number;
    }) => void;
    initialCity?: string;
}

export const LocationPicker = ({ visible, onClose, onSelect, initialCity = 'Almaty' }: LocationPickerProps) => {
    const { language } = useUserStore();
    const t = translations[language];

    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    const [city, setCity] = useState(initialCity);
    const [district, setDistrict] = useState('');
    const [publicDescription, setPublicDescription] = useState('');
    const [exactAddress, setExactAddress] = useState('');
    const [shareExactAddress, setShareExactAddress] = useState(false);

    const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
        'Almaty': { latitude: 43.2220, longitude: 76.8512 },
        'Astana': { latitude: 51.1694, longitude: 71.4491 },
        'Shymkent': { latitude: 42.3417, longitude: 69.5901 },
        'Karaganda': { latitude: 49.8047, longitude: 73.1094 },
        'Aktobe': { latitude: 50.2839, longitude: 57.1661 },
        'Aktau': { latitude: 43.6508, longitude: 51.1601 },
        'Atyrau': { latitude: 47.1164, longitude: 51.8834 },
        'Pavlodar': { latitude: 52.2870, longitude: 76.9675 },
        'Semey': { latitude: 50.4117, longitude: 80.2328 },
        'Kostanay': { latitude: 53.2194, longitude: 63.6311 },
        'Taraz': { latitude: 42.9000, longitude: 71.3661 },
        'Kyzylorda': { latitude: 44.8500, longitude: 65.4833 },
        'Zhezkazgan': { latitude: 47.7972, longitude: 67.7147 },
        'Petropavl': { latitude: 54.8750, longitude: 69.1708 },
        'Other': { latitude: 48.0196, longitude: 66.9237 },
    };

    useEffect(() => {
        if (visible) {
            getCurrentLocation();
        }
    }, [visible]);

    const getCurrentLocation = async () => {
        setLoading(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status !== 'granted') {
                const cityCenter = CITY_COORDS[city] || CITY_COORDS['Almaty'];
                setUserLocation(cityCenter);
                setSelectedLocation(cityCenter);
                Toast.show({
                    type: 'info',
                    text1: t.locationPermission || 'Location Permission',
                    text2: t.locationPermissionSub,
                });
            } else {
                const location = await Location.getCurrentPositionAsync({});
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
                setUserLocation(coords);
                setSelectedLocation(coords);

                Toast.show({
                    type: 'success',
                    text1: t.locationDetected,
                    position: 'bottom',
                    visibilityTime: 2000
                });
            }
        } catch (error) {
            const cityCenter = CITY_COORDS[city] || CITY_COORDS['Almaty'];
            setUserLocation(cityCenter);
            setSelectedLocation(cityCenter);
        } finally {
            setLoading(false);
        }
    };

    const handleMapPress = (event: any) => {
        setSelectedLocation(event.nativeEvent.coordinate);
    };

    const handleConfirm = () => {
        if (!selectedLocation) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.selectLocationOnMap
            });
            return;
        }

        if (!publicDescription.trim()) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.enterPublicDescription
            });
            return;
        }

        onSelect({
            city,
            district: district.trim() || undefined,
            publicDescription: publicDescription.trim(),
            exactAddress: shareExactAddress ? exactAddress.trim() : undefined,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-white">
                {/* Header */}
                <View className="bg-purple-500 pt-14 pb-4 px-6 flex-row justify-between items-center z-10">
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-lg font-pbold">{t.selectLocationTitle || "Select Location"}</Text>
                    <TouchableOpacity onPress={handleConfirm}>
                        <Text className="text-white font-pbold text-lg">{t.doneBtn || "Done"}</Text>
                    </TouchableOpacity>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {loading ? (
                            <View className="h-80 items-center justify-center bg-gray-100">
                                <ActivityIndicator size="large" color="#9333ea" />
                                <Text className="text-gray-500 mt-4">{t.loadingMap || "Loading map..."}</Text>
                            </View>
                        ) : selectedLocation ? (
                            <View>
                                <MapView
                                    style={{ width, height: height * 0.4 }}
                                    initialRegion={{
                                        latitude: selectedLocation.latitude,
                                        longitude: selectedLocation.longitude,
                                        latitudeDelta: 0.02,
                                        longitudeDelta: 0.02,
                                    }}
                                    onPress={handleMapPress}
                                >
                                    <Marker
                                        coordinate={selectedLocation}
                                        title={t.pickupLocation || "Pick-up Location"}
                                        pinColor="#9333ea"
                                    />
                                    <Circle
                                        center={selectedLocation}
                                        radius={500}
                                        strokeColor="rgba(147, 51, 234, 0.3)"
                                        fillColor="rgba(147, 51, 234, 0.1)"
                                    />
                                </MapView>

                                {/* Privacy Info Banner */}
                                <View className="bg-blue-50 border-l-4 border-blue-500 p-3 mx-4 mt-4 rounded-lg">
                                    <View className="flex-row items-start">
                                        <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
                                        <View className="flex-1 ml-2">
                                            <Text className="text-blue-900 font-pbold text-sm">{t.privacyProtected || "Privacy Protected"}</Text>
                                            <Text className="text-blue-700 text-xs mt-1">
                                                {t.privacyProtectedSub || "Your exact location will be hidden. Others see approximate area (~500m radius)."}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <View className="px-6 pt-4">
                                    <Text className="text-gray-700 font-pmedium mb-2">{t.locationCity || "City *"}</Text>
                                    <View className="flex-row flex-wrap gap-2 mb-4">
                                        {Object.keys(CITY_COORDS).map(cityName => (
                                            <TouchableOpacity
                                                key={cityName}
                                                onPress={() => {
                                                    setCity(cityName);
                                                    const coords = CITY_COORDS[cityName];
                                                    setSelectedLocation(coords);
                                                }}
                                                className={`px-4 py-2 rounded-full border ${city === cityName
                                                    ? 'bg-purple-500 border-purple-500'
                                                    : 'border-gray-200'
                                                    }`}
                                            >
                                                <Text className={city === cityName ? 'text-white font-bold' : 'text-gray-600'}>
                                                    {t.cities[cityName as keyof typeof t.cities] || cityName}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* 🆕 翻译公共地标 */}
                                    <Text className="text-gray-700 font-pmedium mb-2">
                                        {t.publicLandmark || "Public Landmark *"}
                                    </Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                        placeholder={t.placeholderLandmark || "e.g., Near Green Bazaar"}
                                        value={publicDescription}
                                        onChangeText={setPublicDescription}
                                    />

                                    <Text className="text-gray-700 font-pmedium mb-2">{t.districtLabel || "District (optional)"}</Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                        placeholder={t.placeholderDistrict || "e.g., Medeu District"}
                                        value={district}
                                        onChangeText={setDistrict}
                                    />

                                    <TouchableOpacity
                                        onPress={() => setShareExactAddress(!shareExactAddress)}
                                        className="flex-row items-center mb-2"
                                    >
                                        <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${shareExactAddress ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                                            }`}>
                                            {shareExactAddress && <Ionicons name="checkmark" size={14} color="white" />}
                                        </View>
                                        <Text className="text-gray-700 font-pmedium">{t.shareExactAddressLabel || "Share exact address (privately)"}</Text>
                                    </TouchableOpacity>

                                    {shareExactAddress && (
                                        <TextInput
                                            className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                            placeholder={t.placeholderExactAddress || "Street address, building number..."}
                                            value={exactAddress}
                                            onChangeText={setExactAddress}
                                            multiline
                                        />
                                    )}

                                    <View className="h-20" />
                                </View>
                            </View>
                        ) : null}
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};