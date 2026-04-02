import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from '@react-native-community/datetimepicker';
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { foodApi, ProductInfo } from "../../api/food";
import { DatePickerField, FormField } from "../../components/HelperForm";
import { useFridgeStore } from "../../store/fridgeStore";

export default function Scan() {
    const router = useRouter();
    const [permission, requestPermission] = useCameraPermissions();
    const { selectedFridge } = useFridgeStore();

    // Scanning state
    const [scanned, setScanned] = useState(false);
    const [scanning, setScanning] = useState(false);

    // Form data (for the Local Modal)
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        category: 'Other',
        quantity: '1',
        unit: 'piece',
        price: '',
        productionDate: null as Date | null,
        expiryDate: null as Date | null,
        notes: '',
        imageUrl: ''
    });

    const [productInfo, setProductInfo] = useState<ProductInfo | null>(null);
    const [showProductModal, setShowProductModal] = useState(false);
    const [loading, setLoading] = useState(false);

    const [showProductionPicker, setShowProductionPicker] = useState(false);
    const [showExpiryPicker, setShowExpiryPicker] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, []);

    // Local Modal Picker
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setFormData(prev => ({ ...prev, imageUrl: base64Img }));
        }
    };

    // 扫码逻辑
    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || scanning) return;

        setScanned(true);
        setScanning(true);

        try {
            const info = await foodApi.lookupBarcode(data);

            setProductInfo(info);
            // 填充表单数据
            setFormData(prev => ({
                ...prev,
                name: info.name,
                brand: info.brand,
                category: info.suggestedCategory,
                imageUrl: info.imageUrl,
                quantity: '1'
            }));

            // 扫码成功：打开 Modal
            setShowProductModal(true);

        } catch (error: any) {
            Alert.alert(
                "Product Not Found",
                "We couldn't find this product.",
                [
                    { text: "Cancel", onPress: () => resetScanner() },
                    {
                        text: "Add Manually", onPress: () => {
                            resetScanner();
                            router.push("/add-manual");
                        }
                    }
                ]
            );
        } finally {
            setScanning(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        setScanning(false);
        setProductInfo(null);
        setShowProductModal(false);
        setFormData({
            name: '',
            brand: '',
            category: 'Other',
            quantity: '1',
            unit: 'piece',
            price: '',
            productionDate: null,
            expiryDate: null,
            notes: '',
            imageUrl: ''
        });
        setShowProductionPicker(false);
        setShowExpiryPicker(false);
    };

    // Modal 内的保存逻辑
    const handleSave = async () => {
        if (!formData.name || !formData.expiryDate) {
            Alert.alert("Missing Info", "Please enter product name and expiry date.");
            return;
        }

        if (!selectedFridge) {
            Alert.alert("Error", "No fridge selected.");
            return;
        }

        setLoading(true);

        try {
            await foodApi.create({
                fridgeId: selectedFridge._id,
                name: formData.name,
                brand: formData.brand || undefined,
                barcode: productInfo?.barcode,
                imageUrl: formData.imageUrl,
                category: formData.category as any,

                // 👇 3. 提交时转数字，如果为空则默认为 1
                quantity: parseInt(formData.quantity) || 1,
                price: formData.price ? parseInt(formData.price) : 0,
                unit: formData.unit,
                productionDate: formData.productionDate || undefined,
                expiryDate: formData.expiryDate,
                notes: formData.notes || undefined
            });

            Alert.alert("Success", "Item added to your fridge!", [
                {
                    text: "OK", onPress: () => {
                        resetScanner();
                        router.push("/(tabs)/fridge");
                    }
                }
            ]);

        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to add item");
        } finally {
            setLoading(false);
        }
    };

    const onProductionDateChange = (event: any, selectedDate?: Date) => {
        setShowProductionPicker(Platform.OS === 'ios');
        if (selectedDate) setFormData(prev => ({ ...prev, productionDate: selectedDate }));
    };

    const onExpiryDateChange = (event: any, selectedDate?: Date) => {
        setShowExpiryPicker(Platform.OS === 'ios');
        if (selectedDate) setFormData(prev => ({ ...prev, expiryDate: selectedDate }));
    };

    if (!permission?.granted) {
        return (
            <View className="flex-1 bg-gray-900 items-center justify-center p-6">
                <Text className="text-white mb-4">Camera permission required</Text>
                <TouchableOpacity onPress={requestPermission} className="bg-primary px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-black">
            <CameraView
                style={{ flex: 1 }}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            />

            {/* Header Overlay */}
            <View className="absolute top-14 left-6 right-6 flex-row justify-between items-center">
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Scan Barcode</Text>
                <View style={{ width: 30 }} />
            </View>

            {/* Scanner Frame */}
            <View className="absolute inset-0 items-center justify-center pointer-events-none">
                <View className="w-72 h-48 border-2 border-white/50 rounded-3xl relative">
                    <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-2xl" />
                    <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-2xl" />
                    <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-2xl" />
                    <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-2xl" />
                </View>
                <Text className="text-white/80 mt-8 font-medium">Scanning...</Text>
            </View>

            {/* 手动录入按钮直接跳转 */}
            <View className="absolute bottom-20 w-full items-center">
                <TouchableOpacity
                    onPress={() => router.push("/add-manual")}
                    className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-full"
                >
                    <Text className="text-white font-bold">Enter Manually</Text>
                </TouchableOpacity>
            </View>

            {/* Product Modal */}
            <Modal visible={showProductModal} animationType="slide" onRequestClose={resetScanner}>
                <View className="flex-1 bg-white">
                    <View className="bg-primary pt-14 pb-4 px-6 flex-row justify-between items-center">
                        <TouchableOpacity onPress={resetScanner}>
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white font-bold text-lg">Confirm Item</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>

                        {/* 图片区域 */}
                        <TouchableOpacity
                            onPress={pickImage}
                            className="w-full h-40 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 items-center justify-center mb-6 overflow-hidden"
                        >
                            {formData.imageUrl ? (
                                <>
                                    <Image
                                        source={{ uri: formData.imageUrl }}
                                        className="w-full h-full"
                                        resizeMode="contain"
                                    />
                                    <View className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded-md">
                                        <Text className="text-white text-xs font-bold">Change</Text>
                                    </View>
                                </>
                            ) : (
                                <View className="items-center">
                                    <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                                    <Text className="text-gray-400 font-medium mt-2">Add Photo</Text>
                                </View>
                            )}
                        </TouchableOpacity>

                        {/* Modal 内的表单 */}
                        <FormField label="Name" value={formData.name} onChangeText={(t: string) => setFormData(p => ({ ...p, name: t }))} />
                        <FormField label="Brand" value={formData.brand} onChangeText={(t: string) => setFormData(p => ({ ...p, brand: t }))} />

                        <View className="flex-row gap-4 mb-4">
                            <View className="flex-1">
                                <FormField
                                    label="Quantity"
                                    value={formData.quantity} //2. 直接绑定字符串
                                    keyboardType="numeric"
                                    onChangeText={(t: string) =>
                                        setFormData(p => ({ ...p, quantity: t.replace(/[^0-9]/g, '') })) //允许空字符串
                                    }
                                />
                            </View>
                            <View className="flex-1">
                                <FormField label="Unit" value={formData.unit} onChangeText={(t: string) => setFormData(p => ({ ...p, unit: t }))} />
                            </View>
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

                        <TouchableOpacity onPress={handleSave} disabled={loading} className="bg-primary mt-6 py-4 rounded-xl items-center">
                            {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Save</Text>}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );
}