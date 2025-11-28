import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function FoodDetail() {
    const { id } = useLocalSearchParams();
    return (
        <View className="flex-1 justify-center items-center bg-white">
            <Text className="text-xl">正在查看 ID 为 {id} 的食品详情</Text>
        </View>
    );
}