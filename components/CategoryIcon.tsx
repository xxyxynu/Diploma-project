import { MaterialCommunityIcons } from "@expo/vector-icons";
import { View } from "react-native";

export const CategoryIcon = ({ category }: { category: string }) => {
    const iconMap: Record<string, { icon: string; color: string; bg: string }> = {
        Dairy: { icon: 'cheese', color: '#3B82F6', bg: 'bg-blue-100' },
        Fruit: { icon: 'food-apple', color: '#EF4444', bg: 'bg-red-100' },
        Vegetables: { icon: 'carrot', color: '#F97316', bg: 'bg-orange-100' },
        Meat: { icon: 'food-steak', color: '#DC2626', bg: 'bg-red-100' },
        Grains: { icon: 'bread-slice', color: '#D97706', bg: 'bg-yellow-100' },
        Beverages: { icon: 'cup', color: '#8B5CF6', bg: 'bg-purple-100' },
        Snacks: { icon: 'popcorn', color: '#F59E0B', bg: 'bg-amber-100' },
        Seafood: { icon: 'fish', color: '#2563EB', bg: 'bg-blue-100' },
        Other: { icon: 'food', color: '#6B7280', bg: 'bg-gray-100' }
    };

    const config = iconMap[category] || iconMap.Other;

    return (
        <View className={`w-10 h-10 ${config.bg} rounded-xl items-center justify-center`}>
            <MaterialCommunityIcons name={config.icon as any} size={20} color={config.color} />
        </View>
    );
};