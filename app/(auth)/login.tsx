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
import { useUserStore } from "../../store/userStore";
import * as SecureStore from "expo-secure-store";
import { authApi } from "../../api/auth";

export default function Login() {
    const router = useRouter();
    const login = useUserStore((state) => state.login);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Missing Fields", "Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            console.log("正在登录...", email);
            const data = await authApi.login({ email, password });

            console.log("登录成功:", data);

            if (data.token) {
                await SecureStore.setItemAsync("user_token", data.token);
                // 也可以顺便存个用户名，以后在 Profile 页面用
                if (data.name) {
                    await SecureStore.setItemAsync("user_name", data.name);
                }
                login({
                    _id: data._id,
                    name: data.name,
                    email: data.email,
                    token: data.token
                });
            }

            // 5. 跳转到主页 (销毁当前栈，用户点返回键不会退回登录页)
            router.replace("/(tabs)");

        } catch (error: any) {
            console.error("登录失败:", error);
            // 获取后端具体的错误信息 (比如 "Invalid credentials")
            const msg = error.response?.data?.message || "Login failed. Please check your network.";
            Alert.alert("Login Error", msg);
        } finally {
            // 6. 关闭 Loading
            setLoading(false);
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
                            Save Food, Save Money
                        </Text>
                    </View>
                </View>

                {/* 表单区域 */}
                <View className="px-6 pt-10 pb-10">
                    <Text className="text-2xl font-pbold text-center text-gray-800 mb-8">
                        Welcome Back!
                    </Text>

                    {/* Email Input */}
                    <View className="mb-5">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">Email</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 text-gray-700 font-pregular"
                                placeholder="hello@ecocart.app"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                        </View>
                    </View>

                    {/* Password Input */}
                    <View className="mb-2">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">Password</Text>
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
                    <TouchableOpacity className="self-end mb-8">
                        <Text className="text-primary font-pregular text-sm">Forgot password?</Text>
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
                            <Text className="text-white text-center font-pbold text-lg">Log in</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm font-pregular">Or continue with</Text>
                        <View className="flex-1 h-[1px] bg-gray-200" />
                    </View>

                    {/* Social Buttons */}
                    <View className="flex-row justify-between gap-4">
                        <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3">
                            <AntDesign name="google" size={20} color="black" />
                            <Text className="ml-2 font-pmedium text-gray-700">Google</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="flex-1 flex-row items-center justify-center border border-gray-200 rounded-xl py-3">
                            <AntDesign name="apple" size={20} color="black" />
                            <Text className="ml-2 font-pmedium text-gray-700">Apple</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bottom Link */}
                    <View className="flex-row justify-center mt-8 mb-4">
                        <Text className="text-gray-600">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => router.push("/sign-up")}>
                            <Text className="text-primary font-psemibold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}