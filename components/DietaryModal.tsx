import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Props {
    visible: boolean;
    onClose: () => void;
    initialValues: string[];
    onSave: (selected: string[]) => void;
}

// 常见的饮食偏好选项
const OPTIONS = [
    "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free",
    "Nut-Free", "Halal", "Kosher", "Low Carb", "Keto", "Paleo"
];

export const DietaryModal = ({ visible, onClose, initialValues, onSave }: Props) => {
    const [selected, setSelected] = useState<string[]>([]);

    useEffect(() => {
        if (visible) setSelected(initialValues || []);
    }, [visible, initialValues]);

    const toggleOption = (opt: string) => {
        if (selected.includes(opt)) {
            setSelected(selected.filter(s => s !== opt));
        } else {
            setSelected([...selected, opt]);
        }
    };

    const handleSave = () => {
        onSave(selected);
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View className="bg-white rounded-t-3xl p-6">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-xl font-pbold text-slate-800">Dietary Restrictions</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Ionicons name="close" size={24} color="#64748b" />
                        </TouchableOpacity>
                    </View>

                    <Text className="text-gray-500 mb-4 font-pmedium">
                        Select any restrictions. Chef AI will avoid these ingredients.
                    </Text>

                    <View className="flex-row flex-wrap gap-3 mb-8">
                        {OPTIONS.map(opt => {
                            const isActive = selected.includes(opt);
                            return (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => toggleOption(opt)}
                                    className={`px-4 py-3 rounded-xl border ${isActive
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-white border-gray-200'
                                        }`}
                                >
                                    <Text className={`font-pbold ${isActive ? 'text-white' : 'text-gray-600'}`}>
                                        {opt}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    <TouchableOpacity
                        onPress={handleSave}
                        className="bg-primary w-full py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-pbold text-lg">Save Preferences</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};