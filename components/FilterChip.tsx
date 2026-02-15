import { TouchableOpacity, Text } from "react-native";

interface FilterChipProps {
    label: string;
    count: number;
    active: boolean;
    onPress: () => void;
    color?: 'green' | 'orange' | 'red';
}

export const FilterChip = ({ label, count, active, onPress, color }: FilterChipProps) => {
    const getBgColor = () => {
        if (!active) return 'bg-white border-gray-200';
        switch (color) {
            case 'green': return 'bg-green-100 border-green-200';
            case 'orange': return 'bg-orange-100 border-orange-200';
            case 'red': return 'bg-red-100 border-red-200';
            default: return 'bg-primary/10 border-primary';
        }
    };

    const getTextColor = () => {
        if (!active) return 'text-gray-600';
        switch (color) {
            case 'green': return 'text-green-700';
            case 'orange': return 'text-orange-700';
            case 'red': return 'text-red-700';
            default: return 'text-primary';
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`px-4 py-2 rounded-full border ${getBgColor()} flex-row items-center`}
        >
            <Text className={`font-pbold text-sm ${getTextColor()}`}>{label}</Text>
            <Text className={`ml-2 text-xs ${getTextColor()}`}>({count})</Text>
        </TouchableOpacity>
    );
};