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
import { useUserStore } from "../store/userStore";
import { translations } from "../i18n/translations";
import { useNetworkStore } from "../store/networkStore";
import Toast from "react-native-toast-message";

export default function AddManual() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { selectedFridge } = useFridgeStore();
    const { isConnected } = useNetworkStore();

    const { language } = useUserStore();
    const t = translations[language];

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
        try {
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

                Toast.show({
                    type: 'success',
                    text1: t.imageSelected,
                    position: 'bottom'
                });
            }
        } catch (e) {
            Toast.show({ type: 'error', text1: t.detailError });
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
        if (!isConnected) {
            Toast.show({
                type: 'error',
                text1: "Offline",
                text2: "Please check your internet connection."
            });
            return;
        }

        if (!formData.name || !formData.expiryDate) {
            Toast.show({
                type: 'error',
                text1: t.missingInfo,
                text2: t.fillRequiredFields
            });
            return;
        }

        if (!isEditing && !selectedFridge) {
            Toast.show({ type: 'error', text1: t.detailError, text2: t.noFridgeSelected });
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
                Toast.show({
                    type: 'success',
                    text1: t.updated,
                    text2: t.itemUpdated,
                });

                router.back();
            } else {
                // Create
                await foodApi.create({
                    ...payload,
                    fridgeId: selectedFridge!._id,
                    barcode: formData.barcode
                });

                Toast.show({
                    type: 'success',
                    text1: t.postSuccess,
                    text2: t.itemAddedSuccess,
                });

                router.replace("/(tabs)/fridge");
            }

        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: t.saveError,
                text2: error.response?.data?.message || t.actionFailed
            });
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
                        {isEditing ? t.editItemTitle : t.addManualTitle}
                    </Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 50 }}>

                {/* 图片上传区域 (优化 UI) */}
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
                                <Text className="text-white text-xs font-pbold">{t.change ?? "Change"}</Text>
                            </View>
                        </>
                    ) : (
                        <View className="items-center">
                            <Ionicons name="camera" size={36} color="gray" />
                            <Text className="text-gray-500 mt-2">{t.addPhoto}</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* 表单字段 */}
                <FormField
                    label={t.itemName}
                    value={formData.name}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, name: t }))}
                    placeholder={t.placeholderName}
                />

                <FormField
                    label={t.brandName}
                    value={formData.brand}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, brand: t }))}
                />

                {/* Category */}
                <Text className="text-gray-700 font-pmedium mb-2">{t.categoryLabel}</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="mb-4"
                    contentContainerStyle={{ flexDirection: 'row' }}
                >
                    {['Dairy', 'Fruit', 'Vegetables', 'Meat', 'Grains', 'Beverages', 'Snacks', 'Seafood', 'Other'].map(cat => (
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
                                {t.categories?.[cat as keyof typeof t.categories] ?? cat}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Quantity / Unit / Price Row */}
                <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                        <FormField label={t.quantity} value={formData.quantity} keyboardType="numeric" onChangeText={t => setFormData(p => ({ ...p, quantity: t.replace(/[^0-9]/g, '') }))} />
                    </View>
                    <View className="flex-1">
                        <FormField label={t.unit} value={formData.unit} onChangeText={t => setFormData(p => ({ ...p, unit: t }))} />
                    </View>
                    {/* 🆕 价格输入框 */}
                    <View className="flex-1">
                        <FormField
                            label={t.price}
                            value={formData.price}
                            keyboardType="numeric"
                            placeholder="0"
                            onChangeText={(t: string) => setFormData(p => ({ ...p, price: t.replace(/[^0-9]/g, '') }))}
                        />
                    </View>
                </View>


                <DatePickerField
                    label={t.productionDate}
                    date={formData.productionDate}
                    onPress={() => setShowProductionPicker(true)}
                    placeholder={t.optional}
                />
                {showProductionPicker && (
                    <DateTimePicker value={formData.productionDate || new Date()} onChange={onProductionDateChange} />
                )}

                <DatePickerField
                    label={t.expiryDate}
                    date={formData.expiryDate}
                    onPress={() => setShowExpiryPicker(true)}
                    required
                />
                {showExpiryPicker && (
                    <DateTimePicker value={formData.expiryDate || new Date()} onChange={onExpiryDateChange} />
                )}

                <FormField
                    label={t.notes}
                    value={formData.notes}
                    onChangeText={(t: string) => setFormData(p => ({ ...p, notes: t }))}
                    placeholder={t.placeholderNotes}
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
                            {isEditing ? t.btnUpdateItem : t.btnAddToFridge}
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

