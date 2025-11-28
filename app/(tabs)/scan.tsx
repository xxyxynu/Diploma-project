import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function MainPage() {
    const router = useRouter();
    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-2xl font-bold text-blue-600">Scan (Main)</Text>
            <Button title="查看某个食品详情" onPress={() => router.push({ pathname: "/food/[id]", params: { id: "123" } })} />
        </View>
    );
}