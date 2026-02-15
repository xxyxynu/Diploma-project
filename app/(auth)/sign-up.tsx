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

export default function SignUp() {
    const router = useRouter();
    const login = useUserStore((state) => state.login);

    // 
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);

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
            }

            router.replace("/(tabs)");

        } catch (error: any) {
            // ... 错误处理 ...
        } finally {
            setLoading(false);
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
                        <Text className="text-white text-2xl font-pbold">Join EcoCart</Text>
                    </View>
                    <Text className="text-primary-light font-pmedium text-center text-sm">
                        Start your zero waste journey today
                    </Text>
                </View>

                {/* 表单区域 */}
                <View className="px-6 pt-8 pb-10">
                    <Text className="text-2xl font-pbold text-center text-gray-800 mb-8">
                        Create Account
                    </Text>

                    {/* Full Name Input */}
                    <View className="mb-4">
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">Full name</Text>
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
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">Email</Text>
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
                        <Text className="text-gray-600 mb-2 ml-1 font-pthin">Password</Text>
                        <View className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3 border border-gray-100 focus:border-primary">
                            <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                            <TextInput
                                className="flex-1 ml-3 font-pregular text-gray-700"
                                placeholder="Min. 8 characters"
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
                            I agree to the <Text className="text-secondary font-pmedium">Terms of Service</Text> and <Text className="text-secondary font-pmedium">Privacy Policy</Text>.
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
                            <Text className="text-white text-center font-pbold text-lg">Get Started</Text>
                        )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View className="flex-row items-center my-8">
                        <View className="flex-1 h-[1px] bg-gray-200" />
                        <Text className="mx-4 text-gray-400 text-sm font-pregular">Or sign up with</Text>
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
                        <Text className="text-gray-600">Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push("/login")}>
                            <Text className="text-primary font-psemibold">Log In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}