import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";

interface WeeklyStats {
    total: number;
    fresh: number;
    expiring: number;
    expired: number;
    score: number;
}

interface Props {
    visible: boolean;
    onClose: () => void;
    data: WeeklyStats | null;
}

export const WeeklyReportModal = ({ visible, onClose, data }: Props) => {
    if (!data) return null;

    // 根据分数给评价
    const getFeedback = () => {
        if (data.expired === 0) return { text: "Zero Waste Hero! 🌟", color: "text-green-600" };
        if (data.expired < 3) return { text: "Good Job! 👍", color: "text-amber-600" };
        return { text: "Let's reduce waste! 💪", color: "text-red-500" };
    };

    const feedback = getFeedback();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View className="flex-1 bg-black/60 items-center justify-center p-6">
                <View className="bg-white w-full rounded-3xl p-6 items-center shadow-lg">

                    {/* Icon */}
                    <View className="bg-amber-100 p-4 rounded-full mb-4">
                        <MaterialCommunityIcons name="chart-box-outline" size={40} color="#D97706" />
                    </View>

                    <Text className="text-2xl font-pbold text-slate-800 mb-1">Weekly Report</Text>
                    <Text className={`font-pmedium text-lg ${feedback.color} mb-6`}>{feedback.text}</Text>

                    {/* Stats Grid */}
                    <View className="flex-row flex-wrap justify-between w-full mb-6">
                        <StatBox label="Total Items" value={data.total} color="bg-gray-50 text-slate-700" />
                        <StatBox label="Fresh" value={data.fresh} color="bg-green-50 text-green-700" />
                        <StatBox label="Expiring" value={data.expiring} color="bg-orange-50 text-orange-600" />
                        <StatBox label="Expired" value={data.expired} color="bg-red-50 text-red-600" />
                    </View>

                    <Text className="text-gray-400 text-xs text-center mb-6">
                        Keep tracking your food to earn more Eco Points!
                    </Text>

                    <TouchableOpacity
                        onPress={onClose}
                        className="bg-amber-500 w-full py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-pbold text-lg">Awesome</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const StatBox = ({ label, value, color }: any) => (
    <View className={`w-[48%] mb-3 p-4 rounded-2xl items-center justify-center ${color.split(' ')[0]}`}>
        <Text className={`text-2xl font-pbold ${color.split(' ')[1]}`}>{value}</Text>
        <Text className="text-gray-500 text-xs mt-1">{label}</Text>
    </View>
);