import { TextInput, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FormFieldProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
    multiline?: boolean;
}

export const FormField = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = "default",
    multiline = false
}: FormFieldProps) => (
    <View className="mb-4">
        <Text className="text-gray-700 font-pmedium mb-2">{label}</Text>
        <TextInput
            className="bg-gray-100 px-4 py-3 rounded-xl text-gray-800 font-pregular"
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboardType}
            multiline={multiline}
            numberOfLines={multiline ? 3 : 1}
        />
    </View>
);

// Helper component for date picker fields
interface DatePickerFieldProps {
    label: string;
    date: Date | null;
    onPress: () => void;
    placeholder?: string;
    required?: boolean;
}

export const DatePickerField = ({ label, date, onPress, placeholder, required }: DatePickerFieldProps) => {
    const formatDate = (date: Date | null) => {
        if (!date) return placeholder || 'Not set';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <View className="mb-4">
            <Text className="text-gray-700 font-pmedium mb-2">{label}</Text>
            <TouchableOpacity
                onPress={onPress}
                className={`bg-gray-100 px-4 py-3 rounded-xl flex-row items-center justify-between ${!date && required ? 'border-2 border-orange-300' : ''}`}
            >
                <View className="flex-row items-center flex-1">
                    <Ionicons
                        name="calendar-outline"
                        size={20}
                        color={date ? "#374151" : "#9CA3AF"}
                    />
                    <Text className={`ml-3 font-pregular ${date ? 'text-gray-800' : 'text-gray-400'}`}>
                        {formatDate(date)}
                    </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
            {!date && required && (
                <Text className="text-orange-500 text-xs mt-1 ml-1">
                    ⚠️ This field is required
                </Text>
            )}
        </View>
    );
};