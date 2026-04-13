import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { authApi } from "../../api/auth";
import { translations } from "@/i18n/translations";
import { useUserStore } from "../../store/userStore";
import Toast from "react-native-toast-message";

export default function ForgotPassword() {
    const router = useRouter();
    const { language } = useUserStore();
    const t = translations[language];

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [loading, setLoading] = useState(false);

    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Step 1: 请求验证码
    const handleSendOTP = async () => {
        if (!email.trim() || !email.includes('@')) {
            Toast.show({ type: 'error', text1: t.invalidEmail, text2: t.emailError });
            return;
        }

        setLoading(true);
        try {
            await authApi.forgotPassword(email.trim().toLowerCase());
            setStep(2);
            Toast.show({ type: 'success', text1: t.codeSent, text2: t.codeSentMsg });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: "Error",
                text2: error.response?.data?.message || "Failed to send code."
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: 验证验证码
    const handleVerifyOTP = async () => {
        if (otp.length !== 4) {
            Toast.show({ type: 'error', text1: "Invalid Code", text2: "Please enter the 4-digit code." });
            return;
        }

        setLoading(true);
        try {
            await authApi.verifyOTP(email.trim().toLowerCase(), otp);
            setStep(3);
            Toast.show({ type: 'success', text1: t.verified, text2: t.verifiedMsg });
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: "Failed",
                text2: error.response?.data?.message || "Invalid or expired code."
            });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: 重置密码
    const handleResetPassword = async () => {
        if (newPassword.length < 6) {
            Toast.show({ type: 'error', text1: "Weak Password", text2: "Min 6 characters." });
            return;
        }

        setLoading(true);
        try {
            await authApi.resetPassword(email.trim().toLowerCase(), newPassword);
            Toast.show({ type: 'success', text1: t.resetSuccess, text2: t.resetSuccessMsg });

            // 延迟跳转以便让用户看到 Toast 成功反馈
            setTimeout(() => {
                router.replace("/(auth)/login");
            }, 2000);
        } catch (error: any) {
            Toast.show({
                type: 'error',
                text1: "Error",
                text2: error.response?.data?.message || "Failed to reset password."
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>

                {/* --- 顶部 Header --- */}
                <View className="bg-primary pt-16 pb-8 px-6 rounded-b-[40px] shadow-md">
                    <View className="flex-row items-center">
                        <TouchableOpacity
                            onPress={() => step === 1 ? router.back() : setStep((step - 1) as any)}
                            className="bg-white/20 p-2 rounded-full"
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                    <View className="mt-6 items-center">
                        <View className="w-16 h-16 bg-white/20 rounded-full items-center justify-center mb-4">
                            <MaterialCommunityIcons name="lock-reset" size={32} color="white" />
                        </View>
                        <Text className="text-white text-3xl font-pbold">{t.resetTitle}</Text>
                        <Text className="text-green-100 mt-2 font-pmedium text-center px-4">
                            {step === 1 && t.step1Desc}
                            {step === 2 && t.step2Desc}
                            {step === 3 && t.step3Desc}
                        </Text>
                    </View>
                </View>

                {/* --- 表单主体 --- */}
                <View className="px-6 pt-10 pb-10 flex-1">
                    {step === 1 && (
                        <View className="flex-1">
                            <Text className="text-gray-700 font-pbold mb-2 ml-1">{t.emailLabel}</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 mb-8">
                                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-800 font-pmedium text-base"
                                    placeholder="hello@ecocart.app"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    autoFocus
                                />
                            </View>
                            <TouchableOpacity onPress={handleSendOTP} disabled={loading} className="bg-primary py-4 rounded-2xl items-center mt-auto mb-10">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-pbold text-lg">{t.sendCode}</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 2 && (
                        <View className="flex-1">
                            <Text className="text-gray-700 font-pbold mb-2 ml-1 text-center">{t.step2Desc}</Text>
                            <TextInput
                                className="bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 mb-8 text-center text-3xl font-pbold tracking-widest text-slate-800"
                                placeholder={t.codePlaceholder}
                                keyboardType="number-pad"
                                maxLength={4}
                                value={otp}
                                onChangeText={setOtp}
                                autoFocus
                            />
                            <TouchableOpacity onPress={handleVerifyOTP} disabled={loading} className="bg-primary py-4 rounded-2xl items-center mt-auto mb-10">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-pbold text-lg">{t.verifyCode}</Text>}
                            </TouchableOpacity>
                        </View>
                    )}

                    {step === 3 && (
                        <View className="flex-1">
                            <Text className="text-gray-700 font-pbold mb-2 ml-1">{t.newPassPlaceholder}</Text>
                            <View className="flex-row items-center bg-gray-50 rounded-2xl px-4 py-4 border border-gray-100 mb-8">
                                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-800 font-pmedium text-base"
                                    placeholder={t.newPassPlaceholder}
                                    secureTextEntry={!showPassword}
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    autoFocus
                                />
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons name={showPassword ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity onPress={handleResetPassword} disabled={loading} className="bg-primary py-4 rounded-2xl items-center mt-auto mb-10">
                                {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-pbold text-lg">{t.resetBtn}</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}