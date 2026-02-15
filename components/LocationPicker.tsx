import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView, // 🆕
    Modal,
    Platform,             // 🆕
    ScrollView,           // 🆕
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import MapView, { Circle, Marker } from 'react-native-maps';

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
    const [loading, setLoading] = useState(false);
    const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);

    // Form fields
    const [city, setCity] = useState(initialCity);
    const [district, setDistrict] = useState('');
    const [publicDescription, setPublicDescription] = useState('');
    const [exactAddress, setExactAddress] = useState('');
    const [shareExactAddress, setShareExactAddress] = useState(false);

    // City centers for Kazakhstan
    const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
        'Almaty': { latitude: 43.2220, longitude: 76.8512 },
        'Astana': { latitude: 51.1694, longitude: 71.4491 },
        'Shymkent': { latitude: 42.3417, longitude: 69.5901 },
        'Karaganda': { latitude: 49.8047, longitude: 73.1094 },
        'Aktau': { latitude: 43.6508, longitude: 51.1601 },
        'Atyrau': { latitude: 47.1164, longitude: 51.8834 }
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
                Alert.alert(
                    'Location Permission',
                    'Please enable location to auto-detect your position, or select manually on the map.'
                );
            } else {
                const location = await Location.getCurrentPositionAsync({});
                const coords = {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                };
                setUserLocation(coords);
                setSelectedLocation(coords);
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
            Alert.alert('Error', 'Please select a location on the map');
            return;
        }

        if (!publicDescription.trim()) {
            Alert.alert('Error', 'Please enter a public location description');
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
                    <Text className="text-white text-lg font-pbold">Select Location</Text>
                    <TouchableOpacity onPress={handleConfirm}>
                        <Text className="text-white font-pbold text-lg">Done</Text>
                    </TouchableOpacity>
                </View>

                {/* 🆕 KeyboardAvoidingView 防止键盘遮挡 */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    {/* 🆕 ScrollView 包裹整个内容区 */}
                    <ScrollView
                        className="flex-1"
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                    >
                        {/* Map */}
                        {loading ? (
                            <View className="h-80 items-center justify-center bg-gray-100">
                                <ActivityIndicator size="large" color="#9333ea" />
                                <Text className="text-gray-500 mt-4">Loading map...</Text>
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
                                        title="Pick-up Location"
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
                                            <Text className="text-blue-900 font-pbold text-sm">Privacy Protected</Text>
                                            <Text className="text-blue-700 text-xs mt-1">
                                                Your exact location will be hidden. Others see approximate area (~500m radius).
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Form Fields */}
                                <View className="px-6 pt-4">
                                    {/* City Selector */}
                                    <Text className="text-gray-700 font-pmedium mb-2">City *</Text>
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
                                                    {cityName}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Public Description */}
                                    <Text className="text-gray-700 font-pmedium mb-2">
                                        Public Landmark *
                                    </Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                        placeholder="e.g., Near Green Bazaar"
                                        value={publicDescription}
                                        onChangeText={setPublicDescription}
                                    />

                                    {/* District (Optional) */}
                                    <Text className="text-gray-700 font-pmedium mb-2">District (optional)</Text>
                                    <TextInput
                                        className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                        placeholder="e.g., Medeu District"
                                        value={district}
                                        onChangeText={setDistrict}
                                    />

                                    {/* Exact Address Toggle */}
                                    <TouchableOpacity
                                        onPress={() => setShareExactAddress(!shareExactAddress)}
                                        className="flex-row items-center mb-2"
                                    >
                                        <View className={`w-5 h-5 rounded border-2 mr-3 items-center justify-center ${shareExactAddress ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                                            }`}>
                                            {shareExactAddress && <Ionicons name="checkmark" size={14} color="white" />}
                                        </View>
                                        <Text className="text-gray-700 font-pmedium">Share exact address (privately)</Text>
                                    </TouchableOpacity>

                                    {shareExactAddress && (
                                        <TextInput
                                            className="bg-gray-100 px-4 py-3 rounded-xl mb-4 text-gray-800"
                                            placeholder="Street address, building number..."
                                            value={exactAddress}
                                            onChangeText={setExactAddress}
                                            multiline
                                        />
                                    )}

                                    {/* 底部留白，防止被键盘顶死 */}
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