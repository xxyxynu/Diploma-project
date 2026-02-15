import { FridgeItem } from "@/api/food";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { TouchableOpacity, View, Image, Text } from "react-native";

interface ExpiringItemCardProps {
    item: FridgeItem;
    selected: boolean;
    onSelect: () => void;
    onConsume: () => void;
    onDelete: () => void;
}

export const ExpiringItemCard = ({ item, selected, onSelect, onConsume, onDelete }: ExpiringItemCardProps) => {
    const now = new Date();
    const expiry = new Date(item.expiryDate);
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Style config
    const getUrgencyConfig = () => {
        if (item.status === 'expired') {
            return {
                borderColor: 'border-gray-50',
                bgColor: 'bg-red-50',
                badgeBg: 'bg-red-100',
                badgeText: 'text-red-600',
                label: daysLeft < -1 ? `Expired ${Math.abs(daysLeft)} days ago` : 'Expired',
                icon: 'close-circle' as const,
                iconColor: '#DC2626'
            };
        } else if (daysLeft === 0) {
            return {
                borderColor: 'border-gray-50',
                bgColor: 'bg-orange-50',
                badgeBg: 'bg-orange-100',
                badgeText: 'text-orange-600',
                label: 'Expires today!',
                icon: 'alert-circle' as const,
                iconColor: '#F97316'
            };
        } else {
            return {
                borderColor: 'border-gray-50',
                bgColor: 'bg-amber-50',
                badgeBg: 'bg-amber-100',
                badgeText: 'text-amber-600',
                label: daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days left`,
                icon: 'time' as const,
                iconColor: '#F59E0B'
            };
        }
    };

    const config = getUrgencyConfig();

    return (
        <TouchableOpacity
            onPress={onSelect}
            activeOpacity={0.8}
            className="bg-white rounded-2xl p-4"
        >
            <View className="flex-row items-center mb-3">
                {/* Checkbox */}
                <View className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${selected ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                    {selected && <Ionicons name="checkmark" size={14} color="white" />}
                </View>

                {/* Image */}
                <View className={`w-14 h-14 rounded-xl items-center justify-center mr-3 bg-gray-50`}>
                    {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} className="w-full h-full rounded-xl" resizeMode="contain" />
                    ) : (
                        <MaterialCommunityIcons name="food" size={28} color="#9CA3AF" />
                    )}
                </View>

                {/* Info */}
                <View className="flex-1">
                    <Text className="text-gray-900 font-pbold text-base" numberOfLines={1}>{item.name}</Text>
                    <Text className="text-gray-400 text-xs mt-1">{item.quantity} {item.unit} • {item.category}</Text>

                    <View className={`self-start flex-row items-center px-2 py-1 rounded-lg ${config.badgeBg} mt-2`}>
                        <Ionicons name={config.icon} size={12} color={config.iconColor} />
                        <Text className={`text-xs font-pbold ml-1 ${config.badgeText}`}>{config.label}</Text>
                    </View>
                </View>
            </View>

            {/* Actions (Only show if not expired for consume, always for delete) */}
            <View className="flex-row gap-2">
                {item.status !== 'expired' && (
                    <TouchableOpacity
                        onPress={onConsume}
                        className="flex-1 bg-green-50 border border-green-200 py-2.5 rounded-xl flex-row items-center justify-center"
                    >
                        <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                        <Text className="text-green-600 font-pbold text-sm ml-1">Consumed</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    onPress={onDelete}
                    className="flex-1 bg-gray-50 border border-gray-200 py-2.5 rounded-xl flex-row items-center justify-center"
                >
                    <Ionicons name="trash-outline" size={16} color="#6B7280" />
                    <Text className="text-gray-600 font-pbold text-sm ml-1">Remove</Text>
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};