import { Ionicons } from "@expo/vector-icons";
import { View, Text } from "react-native";

export const DetailBox = ({ icon, label, value, subValue }: any) => (
    <View className="flex-1 min-w-[45%] bg-slate-50 p-5 rounded-[28px] border border-slate-100">
        <View className="bg-white w-10 h-10 rounded-xl items-center justify-center mb-3 shadow-sm shadow-slate-200">
            <Ionicons name={icon} size={20} color="#64748b" />
        </View>
        <Text className="text-slate-400 font-psemibold text-[10px] uppercase mb-1">{label}</Text>
        <Text className="text-slate-900 font-pbold text-sm" numberOfLines={1}>{value}</Text>
        {subValue && <Text className="text-slate-400 text-[10px] mt-0.5">{subValue}</Text>}
    </View>
);