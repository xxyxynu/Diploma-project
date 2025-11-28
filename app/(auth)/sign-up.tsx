import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function SignUp() {
    const router = useRouter();

    // 表单状态管理
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // UI 交互状态
    const [showPassword, setShowPassword] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const handleSignUp = () => {
        // 这里写注册逻辑 (API调用)
        console.log("Sign Up with:", name, email, password);

        // 注册成功后，通常跳转到登录页让用户登录，或者直接存储 Token 跳进首页
        // 目前演示跳转到登录页
        router.push("/login");
    };

    return (
        <View className="flex-1 bg-white">
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* 顶部绿色 Header */}
                <View className="bg-primary pt-16 pb-10 px-6 rounded-b-[30px] shadow-sm">
                    {/* 装饰图标：苹果 (绝对定位) */}
                    <MaterialCommunityIcons
                        name="food-apple-outline"
                        size={80}
                        color="white"
                        style={{
                            position: 'absolute',
                            top: 50,
                            left: 20,
                            opacity: 0.2, // 透明度，制造水印效果
                            transform: [{ rotate: '-15deg' }]
                        }}
                    />

                    {/* 装饰图标：萝卜 (绝对定位) */}
                    <MaterialCommunityIcons
                        name="carrot"
                        size={80}
                        color="white"
                        style={{
                            position: 'absolute',
                            top: 40,
                            right: 10,
                            opacity: 0.2, // 透明度
                            transform: [{ rotate: '15deg' }]
                        }}
                    />

                    <View className="flex-row items-center justify-center mb-2">
                        {/* 这里可以放你的 Logo 图片，暂时用图标代替 */}
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

                    {/* Sign Up Button */}
                    <TouchableOpacity
                        className="bg-secondary rounded-2xl py-4 shadow-md shadow-secondary-light"
                        onPress={handleSignUp}
                    >
                        <Text className="text-white text-center font-pbold text-lg">Get Started</Text>
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