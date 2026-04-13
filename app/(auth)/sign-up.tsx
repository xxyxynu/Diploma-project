import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import * as SecureStore from "expo-secure-store";
import { authApi } from "../../api/auth";
import { useUserStore } from "../../store/userStore";
import { translations } from "@/i18n/translations";
import Toast from "react-native-toast-message";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function SignUp() {
    const router = useRouter();
    const login = useUserStore((state) => state.login);

    // 
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [loading, setLoading] = useState(false);

    const { language } = useUserStore();

    const t = translations[language];

    const handleSignUp = async () => {
        setLoading(true);

        // 1. 基础校验
        if (!name || !email || !password) {
            Toast.show({
                type: 'error',
                text1: t.missingFields,
                text2: t.enterEmailPass,
            });
            return;
        }

        // 2. 复选框校验
        if (!isChecked) {
            Toast.show({
                type: 'info',
                text1: t.agreeToTermsError,
                text2: t.mustAgreePrompt,
            });
            return;
        }

        try {
            const data = await authApi.register({ name, email, password });

            // 3. 修复逻辑：不仅要存 SecureStore，还要更新 Zustand Store
            if (data.token) {
                await SecureStore.setItemAsync("user_token", data.token);
                if (data.name) {
                    await SecureStore.setItemAsync("user_name", data.name);
                }

                // ✅ 新增这一步：更新全局状态
                login({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    token: data.token
                });

                Toast.show({
                    type: 'success',
                    text1: t.registrationSuccess,
                    text2: t.registrationSuccessDetail,
                });
            }

            router.replace("/(tabs)");

        } catch (error: any) {
            const msg = error.response?.data?.message || "Registration failed. Try again.";
            Toast.show({
                type: 'error',
                text1: t.registrationError,
                text2: msg,
            })
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        try {
            // 1. 检查设备是否支持 Google Play Services
            await GoogleSignin.hasPlayServices();

            // 2. 唤起 Google 授权弹窗
            const userInfo = await GoogleSignin.signIn();

            // 3. 拿到 Google 给的 idToken (这是证明你身份的密码)
            const idToken = userInfo.data?.idToken;

            if (!idToken) {
                throw new Error("No ID token received from Google");
            }

            // 4. 把 idToken 发给我们的 Node.js 后端进行验证和注册
            const data = await authApi.googleLogin(idToken);

            // 5. 后端验证成功，返回了我们自己的 JWT Token，走正常登录流程
            if (data.token) {
                await SecureStore.setItemAsync("user_token", data.token);
                await SecureStore.setItemAsync("user_name", data.name);

                login({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    token: data.token,
                    ecoPoints: data.ecoPoints,
                    dietaryPreferences: data.dietaryPreferences,
                    city: data.city
                });

                router.replace("/(tabs)");
            }

        } catch (error: any) {
            console.error("Google Login Error:", error);

            // 细分 Google 登录的错误类型
            if (error.code === statusCodes.SIGN_IN_CANCELLED) {
                // 用户取消了登录弹窗 (不需要弹报错)
                console.log("User cancelled the login flow");
            } else if (error.code === statusCodes.IN_PROGRESS) {
                // 已经在登录中了
                Alert.alert("In Progress", "Login is already running");
            } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                // 手机没装谷歌框架 (比如某些国行安卓机)
                Alert.alert("Error", "Google Play Services is not available or outdated");
            } else {
                // 其他后端或网络错误
                Alert.alert("Login Failed", "Could not sign in with Google. Please try again.");
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 顶部绿色 Header */}
                <View className="bg-primary pt-16 pb-10 px-6 rounded-b-[30px] shadow-sm">
                    <MaterialCommunityIcons name="leaf" size={140} color="white" style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                    <MaterialCommunityIcons name="food-apple" size={100} color="white" style={{ position: 'absolute', left: -20, top: 20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />

                    <View className="flex-row items-center justify-center mb-2">
                        <Ionicons name="leaf-outline" size={32} color="white" style={{ marginRight: 8 }} />
                        <Text className="text-white text-2xl font-pbold">{t.join}</Text>
                    </View>
                    <Text className="text-primary-light font-pmedium text-center text-sm">
                        {t.start}
                    </Text>
                </View>

                {/* 表单区域 */}
                <View className="px-6 pt-8 pb-10">
                    <Text className="text-2xl font-pbold text-center text-gray-800 mb-8">
                        {t.createAccount}
                    </Text>

                    {/* Full Name Input */}
                    <View className="mb-4">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">{t.fullName}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 font-pregular text-gray-700"
                                placeholder="e.g. Jessica Lin"
                                value={name}
                                onChangeText={setName}
                            />
                        </View>
                    </View>

                    {/* Email Input */}
                    <View className="mb-4">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">{t.email}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 font-pregular text-gray-700"
                                placeholder="hello@ecocart.app"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View className="mb-6">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">{t.password}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 font-pregular text-gray-700"
                                placeholder={t.passwordPlaceholder}
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons
                                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                                    size={20}
                                    color="#9CA3AF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Terms Checkbox */}
                    <View className="flex-row items-center mb-8">
                        <TouchableOpacity
                            onPress={() => setIsChecked(!isChecked)}
                            className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${isChecked ? 'bg-secondary border-secondary' : 'border-gray-400 bg-white'}`}
                        >
                            {isChecked && <Ionicons name="checkmark" size={14} color="white" />}
                        </TouchableOpacity>
                        <Text className="text-gray-600 font-pregular text-sm flex-1">
                            {t.iAgreeTo} <Text className="text-secondary font-pmedium">{t.termsOfService}</Text> {t.and} <Text className="text-secondary font-pmedium">{t.privacyPolicy}</Text>.
                        </Text>
                    </View>

                    {/* Sign Up Button (带 Loading 效果) */}
                    <TouchableOpacity
                        className={`rounded-2xl py-4 shadow-md shadow-secondary-light flex-row justify-center items-center ${loading ? 'bg-green-300' : 'bg-secondary'}`}
                        onPress={handleSignUp}
                        disabled={loading} // 加载时禁止点击
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-pbold text-lg">{t.getStarted}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm font-pregular">{t.orSignUpWith}</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Social Buttons */}
                    <View className="flex-row justify-between gap-4">
                        <TouchableOpacity
                            onPress={handleGoogleLogin}
                            disabled={loading || googleLoading}
                            className="flex-1 flex-row items-center justify-center bg-white border border-gray-200 rounded-xl py-3 shadow-sm active:bg-gray-50"
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#4285F4" /> // 谷歌蓝
                            ) : (
                                <>
                                    <AntDesign name="google" size={20} color="#EA4335" />
                                    <Text className="ml-2 font-pbold text-gray-700">Google</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Link */}
                    <View className="flex-row justify-center mt-8 mb-4">
                        <Text className="text-gray-600">{t.alreadyHaveAccount}</Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                            <Text className="text-primary font-psemibold">{t.login}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}