import { DatePickerField, FormField } from "@/components/HelperForm";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker'; // 📦 引入图片选择器
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi } from "../api/food";
import { useFridgeStore } from "../store/fridgeStore";
export default function AddManual() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { selectedFridge } = useFridgeStore();

    // 🆕 判断是否为编辑模式
    const isEditing = !!params.id;
    const itemId = params.id as string;

    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: (params.name as string) || '',
        brand: (params.brand as string) || '',
        barcode: (params.barcode as string) || '',
        imageUrl: (params.imageUrl as string) || '', // 这里可能是 URL 也就是 Base64
        category: (params.suggestedCategory as string) || (params.category as string) || 'Other',
        quantity: params.quantity ? String(params.quantity) : '1',
        unit: (params.unit as string) || 'piece',
        price: params.price ? String(params.price) : '',
        // 日期字符串转对象
        productionDate: params.productionDate ? new Date(params.productionDate as string) : null as Date | null,
        expiryDate: params.expiryDate ? new Date(params.expiryDate as string) : null as Date | null,
        notes: (params.notes as string) || ''
    });

    const [showProductionPicker, setShowProductionPicker] = useState(false);
    const [showExpiryPicker, setShowExpiryPicker] = useState(false);

    // 📷 图片选择逻辑 (新增)
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true, // ⚠️ 必须开启，用于上传到 Cloudinary
        });

        if (!result.canceled && result.assets[0].base64) {
            // 构造 Base64 字符串
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData(prev => ({ ...prev, imageUrl: base64Img }));
        }
    };

    // 日期处理
    const onProductionDateChange = (event: any, selectedDate?: Date) => {
        setShowProductionPicker(Platform.OS === 'ios');
        if (event.type !== 'dismissed' && selectedDate) {
            setFormData(prev => ({ ...prev, productionDate: selectedDate }));
        }
    };

    const onExpiryDateChange = (event: any, selectedDate?: Date) => {
        setShowExpiryPicker(Platform.OS === 'ios');
        if (event.type !== 'dismissed' && selectedDate) {
            setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
        }
    };

    // 保存逻辑
    const handleSave = async () => {
        if (!formData.name || !formData.expiryDate) {
            Alert.alert("Missing Info", "Please enter product name and expiry date.");
            return;
        }

        if (!isEditing && !selectedFridge) {
            Alert.alert("Error", "No fridge selected.");
            return;
        }

        setLoading(true);
        try {
            const payload = {
                name: formData.name,
                brand: formData.brand,
                quantity: parseInt(formData.quantity) || 1,
                unit: formData.unit,
                price: formData.price ? parseInt(formData.price) : 0,
                category: formData.category,
                productionDate: formData.productionDate || undefined,
                expiryDate: formData.expiryDate!,
                imageUrl: formData.imageUrl, // 无论是 URL 还是 Base64，都直接传给后端
                notes: formData.notes
            };

            if (isEditing) {
                // Update
                await foodApi.update(itemId, payload);
                Alert.alert("Updated", "Item updated successfully!", [
                    { text: "OK", onPress: () => router.back() }
                ]);
            } else {
                // Create
                await foodApi.create({
                    ...payload,
                    fridgeId: selectedFridge!._id,
                    barcode: formData.barcode
                });
                Alert.alert("Success", "Item added to your fridge!", [
                    { text: "OK", onPress: () => router.replace("/(tabs)/fridge") }
                ]);
            }

        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to save item");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-primary pt-14 pb-6 px-6 rounded-b-[30px] shadow-sm">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-pbold">
                        {isEditing ? "Edit Item" : "Add to Fridge"}
                    </Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 50 }}>

                {/* 📷 图片上传区域 (优化 UI) */}
                <TouchableOpacity
                    onPress={pickImage}
                    className="w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mb-6 overflow-hidden"
                >
                    {formData.imageUrl ? (
                        <>
                            <Image
                                source={{ uri: formData.imageUrl }}
                                className="w-full h-full"
                                resizeMode="cover"
                            />
                            {/* 覆盖层提示可以修改 */}
                            <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-md">
                                <Text className="text-white text-xs font-pbold">Change</Text>
                            </View>
                        </>
                    ) : (
                        <View className="items-center">
                            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                            <Text className="text-gray-400 font-pmedium mt-2">Add Photo</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 表单字段 */}
                <FormField
                    label="Product Name *"
                    value={formData.name}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, name: t }))}
                    placeholder="e.g. Organic Milk"
                />

                <FormField
                    label="Brand"
                    value={formData.brand}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, brand: t }))}
                    placeholder="e.g. Horizon"
                />

                {/* Category */}
                <Text className="text-gray-700 font-pmedium mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4 flex-row">
                    {['Dairy', 'Fruit', 'Vegetables', 'Meat', 'Beverages', 'Snacks', 'Other'].map(cat => (
                        <TouchableOpacity
                            key={cat}
                            onPress={() => setFormData(p => ({ ...p, category: cat }))}
                            className={`mr-2 px-4 py-2 rounded-full border ${formData.category === cat
                                ? 'bg-primary border-primary'
                                : 'bg-gray-100 border-gray-100'
                                }`}
                        >
                            <Text className={
                                formData.category === cat
                                    ? 'text-white font-pbold'
                                    : 'text-gray-500 font-pmedium'
                            }>
                                {cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Quantity / Unit / Price Row */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <FormField label="Qty" value={formData.quantity} keyboardType="numeric" onChangeText={t => setFormData(p => ({ ...p, quantity: t.replace(/[^0-9]/g, '') }))} />
                    </View>
                    <View className="flex-1">
                        <FormField label="Unit" value={formData.unit} onChangeText={t => setFormData(p => ({ ...p, unit: t }))} />
                    </View>
                    {/* 🆕 价格输入框 */}
                    <View className="flex-1">
                        <FormField
                            label="Price (₸)"
                            value={formData.price}
                            keyboardType="numeric"
                            placeholder="0"
                            onChangeText={(t: string) => setFormData(p => ({ ...p, price: t.replace(/[^0-9]/g, '') }))}
                        />
                    </View>
                </View>


                <DatePickerField
                    label="Production Date"
                    date={formData.productionDate}
                    onPress={() => setShowProductionPicker(true)}
                    placeholder="Optional"
                />
                {showProductionPicker && (
                    <DateTimePicker value={formData.productionDate || new Date()} onChange={onProductionDateChange} />
                )}

                <DatePickerField
                    label="Expiry Date *"
                    date={formData.expiryDate}
                    onPress={() => setShowExpiryPicker(true)}
                    required
                />
                {showExpiryPicker && (
                    <DateTimePicker value={formData.expiryDate || new Date()} onChange={onExpiryDateChange} />
                )}

                <FormField
                    label="Notes"
                    value={formData.notes}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, notes: t }))}
                    placeholder="Any details..."
                    multiline
                />

                <TouchableOpacity
                    onPress={handleSave}
                    disabled={loading}
                    className={`mt-6 mb-10 py-4 rounded-2xl flex-row justify-center items-center ${loading ? 'bg-gray-300' : 'bg-secondary'
                        }`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-pbold text-lg">
                            {isEditing ? "Update Item" : "Add to Fridge"}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

