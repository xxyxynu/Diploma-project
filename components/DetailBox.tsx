import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

export const DetailBox = ({ icon, label, value, highlight }: any) => (
    <View className={`w-[48%] bg-white p-3 rounded-2xl border ${highlight ? 'border-orange-200 bg-orange-50' : 'border-gray-100'}`}>
        <View className="flex-row items-center mb-2">
            <Ionicons name={icon} size={16} color={highlight ? "#f97316" : "#94a3b8"} />
            <Text className={`ml-1 text-xs font-bold uppercase ${highlight ? "text-orange-500" : "text-gray-400"}`}>
                {label}
            </Text>
        </View>
        <Text className="text-slate-800 font-pbold text-sm" numberOfLines={1}>
            {value}
        </Text>
    </View>
);