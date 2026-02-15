import { Ionicons } from "@expo/vector-icons";
import { TouchableOpacity, View, Text } from "react-native";

// 2. 通用菜单项组件
interface MenuItemProps {
    icon: any;
    title: string;
    subtitle?: string;
    rightElement?: React.ReactNode;
    hasArrow?: boolean;
    onPress?: () => void;
}

export const MenuItem = ({ icon, title, subtitle, rightElement, hasArrow, onPress }: MenuItemProps) => (
    <TouchableOpacity
        onPress={onPress}
        disabled={!onPress && !hasArrow}
        className="flex-row items-center p-4 active:bg-gray-50 rounded-xl"
    >
        <View className="w-10 h-10 bg-gray-50 rounded-full items-center justify-center mr-3">
            <Ionicons name={icon} size={20} color="#64748b" />
        </View>
        <View className="flex-1">
            <Text className="text-slate-800 font-pbold text-base">{title}</Text>
            {subtitle && <Text className="text-gray-400 text-xs mt-0.5">{subtitle}</Text>}
        </View>
        {rightElement}
        {hasArrow && <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />}
    </TouchableOpacity>
);