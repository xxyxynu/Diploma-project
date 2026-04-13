import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View, Text } from "react-native";

export const StatItem = ({ value, label, icon, color }: any) => (
    <View className="items-center flex-1">
        <MaterialCommunityIcons name={icon} size={24} color={color.replace('text-', '').replace('-500', '') === 'text-slate-800' ? '#1e293b' : color.includes('orange') ? '#f97316' : '#22c55e'} className="mb-1" />
        <Text className={`text-xl font-extrabold ${color}`}>{value}</Text>
        <Text className="text-gray-400 text-xs font-pmedium mt-2 text-center">{label}</Text>
    </View>
);

