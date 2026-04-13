import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { useUserStore } from "../../store/userStore";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../../api/auth";
import { translations } from "@/i18n/translations";
import Toast from "react-native-toast-message";
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

export default function Login() {
    const router = useRouter();
    const login = useUserStore((state) => state.login);

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [loading, setLoading] = useState(false);

    const { refreshUser, language } = useUserStore();

    const t = translations[language];

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: '297935027127-fu2dpgilh0hc84m88otsief6fpt8ornf.apps.googleusercontent.com',
            offlineAccess: true,
            forceCodeForRefreshToken: true,
        });
    }, []);

    const handleLogin = async () => {
        if (!username || !password) {
            Toast.show({
                type: 'error',
                text1: t.missingFields,
                text2: t.enterEmailPass,
            });
            return;
        }

        setLoading(true);

        try {
            const data = await authApi.login({ username, password });
            if (data.token) {
                await SecureStore.setItemAsync("user_token", data.token);
                if (data.name) {
                    await SecureStore.setItemAsync("user_name", data.name);
                }
                login({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    token: data.token,
                    ecoPoints: data.ecoPoints,
                    dietaryPreferences: data.dietaryPreferences,
                    city: data.city
                });

                await refreshUser();
            }
            Toast.show({
                type: 'success',
                text1: t.loginSuccess,
                text2: `${t.welcomeBack}, ${data.name}!`,
            });

            // 5. 跳转到主页 (销毁当前栈，用户点返回键不会退回登录页)
            router.replace("/(tabs)");

        } catch (error: any) {
            const status = error.response?.status;
            const serverMsg = error.response?.data?.message;

            // 🆕 根据状态码给出友好提示
            let errorMsg = t.loginErrorDefault; // "Please check your network."
            if (status === 401) {
                errorMsg = t.loginErrorWrongCredentials; // "Username or password is incorrect."
            } else if (status === 404) {
                errorMsg = t.loginErrorNotFound; // "Account not found."
            } else if (status === 400) {
                errorMsg = serverMsg || t.loginErrorDefault;
            }

            Toast.show({
                type: 'error',
                text1: t.loginErrorTitle,
                text2: errorMsg,
            });
        } finally {
            // 6. 关闭 Loading
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

                Toast.show({
                    type: 'success',
                    text1: t.loginSuccess,
                    text2: t.googleLoginSuccessDesc || "Logged in with Google",
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

                {/* 顶部绿色 Header (带水果背景) */}
                <View className="bg-primary pt-20 pb-12 px-6 rounded-b-[30px] relative overflow-hidden shadow-sm">
                    <MaterialCommunityIcons name="leaf" size={140} color="white" style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
                    <MaterialCommunityIcons name="food-apple" size={100} color="white" style={{ position: 'absolute', left: -20, top: 20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />


                    {/* Header 文字内容 */}
                    <View className="items-center justify-center z-10">
                        <Text className="text-white text-3xl font-pbold tracking-wide">EcoCart</Text>
                        <Text className="text-primary-light mt-1 text-sm font-pmedium">
                            {t.saveFoodSaveMoney}
                        </Text>
                    </View>
                </View>

                {/* 表单区域 */}
                <View className="px-6 pt-10 pb-10">
                    <Text className="text-2xl font-pbold text-center text-gray-800 mb-8">
                        {t.welcomeBack}
                    </Text>

                    {/* Email Input */}
                    <View className="mb-5">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">{t.username}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-700 font-pregular"
                                placeholder={t.usernamePlaceholder}
                                autoCapitalize="none"
                                value={username}
                                onChangeText={setUsername}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View className="mb-2">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">{t.password}</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-700 font-pregular"
                                placeholder="••••••••"
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

                    {/* Forgot Password */}
                    <TouchableOpacity
                        className="self-end mb-8"
                        onPress={() => router.push("/(auth)/forgot-password")}
                    >
                        <Text className="text-primary font-pregular text-sm">{t.forgotPassword}</Text>
                    </TouchableOpacity>

                    {/* Log In Button (带 Loading) */}
                    <TouchableOpacity
                        className={`rounded-2xl py-4 shadow-md shadow-primary-light flex-row justify-center items-center ${loading ? 'bg-green-300' : 'bg-primary'}`}
                        onPress={handleLogin}
                        disabled={loading} // Loading 时禁止点击
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text className="text-white text-center font-pbold text-lg">{t.login}</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm font-pregular">{t.orContinueWith}</Text>
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
                        <Text className="text-gray-600">{t.dontHaveAccount} </Text>
                        <TouchableOpacity onPress={() => router.push("/sign-up")}>
                            <Text className="text-primary font-psemibold">{t.signUp}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}