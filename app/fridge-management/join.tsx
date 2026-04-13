import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { fridgeApi } from "../../api/fridge";
import { translations } from "../../i18n/translations";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore } from "../../store/userStore";
import Toast from "react-native-toast-message";

export default function JoinFridge() {
    const router = useRouter();
    const { addFridge } = useFridgeStore();
    const { language } = useUserStore();
    const t = translations[language];

    const [inviteCode, setInviteCode] = useState("");
    const [loading, setLoading] = useState(false);

    const handleJoin = async () => {
        if (!inviteCode.trim()) {
            Toast.show({
                type: 'error',
                text1: t.missingCode,
                text2: t.enterInviteCode
            });
            return;
        }

        setLoading(true);
        try {
            const result = await fridgeApi.joinFridge(inviteCode.trim().toUpperCase());
            addFridge(result.fridge);

            Toast.show({
                type: 'success',
                text1: t.joinSuccess,
                text2: result.message || "",
            });

            router.back();
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: error.response?.data?.message || t.failedJoinFridge
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            {/* Header */}
            <View className="bg-primary pt-14 pb-6 px-6 rounded-b-[30px]">
                <View className="flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={28} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white text-xl font-pbold">{t.joinFridgeTitle}</Text>
                    <View style={{ width: 28 }} />
                </View>
            </View>

            <View className="flex-1 px-6 pt-12">
                {/* Instructions */}
                <View className="bg-blue-50 p-4 rounded-2xl mb-8">
                    <Text className="text-blue-900 font-pmedium">
                        {t.inviteInstruction}
                    </Text>
                </View>

                {/* Invite Code Input */}
                <View className="mb-6">
                    <Text className="text-gray-700 font-pmedium mb-2">{t.inviteCode}</Text>
                    <TextInput
                        className="bg-gray-100 px-4 py-4 rounded-xl text-gray-800 font-pbold text-center text-2xl tracking-widest"
                        placeholder="XXXXXXXX"
                        value={inviteCode}
                        onChangeText={(text) => setInviteCode(text.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={8}
                    />
                </View>

                {/* Join Button */}
                <TouchableOpacity
                    onPress={handleJoin}
                    disabled={loading}
                    className={`py-4 rounded-2xl ${loading ? "bg-gray-300" : "bg-secondary"}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white text-center font-pbold text-lg">
                            {t.joinFridgeTitle}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
