import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, Text, TouchableOpacity, View } from "react-native";
import { useUserStore } from "../store/userStore";
import { translations } from "../i18n/translations";

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
    const { language } = useUserStore();
    const t = translations[language];

    if (!data) return null;

    const getFeedback = () => {
        if (data.expired === 0) return { text: t.feedbackHero, color: "text-green-600" };
        if (data.expired < 3) return { text: t.feedbackGood, color: "text-amber-600" };
        return { text: t.feedbackImprove, color: "text-red-500" };
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

                    <Text className="text-2xl font-pbold text-slate-800 mb-1">{t.weeklyReportTitle}</Text>
                    <Text className={`font-pmedium text-lg ${feedback.color} mb-6`}>{feedback.text}</Text>

                    {/* Stats Grid */}
                    <View className="flex-row flex-wrap justify-between w-full mb-6">
                        <StatBox label={t.totalItemsLabel} value={data.total} color="bg-gray-50 text-slate-700" />
                        <StatBox label={t.freshLabel} value={data.fresh} color="bg-green-50 text-green-700" />
                        <StatBox label={t.expiringLabel} value={data.expiring} color="bg-orange-50 text-orange-600" />
                        <StatBox label={t.expiredLabel} value={data.expired} color="bg-red-50 text-red-600" />
                    </View>

                    <Text className="text-gray-400 text-xs text-center mb-6">
                        {t.ecoPointsPrompt}
                    </Text>

                    <TouchableOpacity
                        onPress={onClose}
                        className="bg-amber-500 w-full py-4 rounded-2xl items-center"
                    >
                        <Text className="text-white font-pbold text-lg">{t.awesomeBtn}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const StatBox = ({ label, value, color }: any) => (
    <View className={`w-[48%] mb-3 p-4 rounded-2xl items-center justify-center ${color.split(' ')[0]}`}>
        <Text className={`text-2xl font-pbold ${color.split(' ')[1]}`}>{value}</Text>
        <Text className="text-gray-500 text-[10px] mt-1 text-center font-psemibold uppercase">{label}</Text>
    </View>
);