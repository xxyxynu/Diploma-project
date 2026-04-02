import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Dimensions, Text, View } from "react-native";
import { LineChart, ProgressChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

interface PointHistory {
    points: number;
    date: string;
}

interface EfficiencyStats {
    itemsConsumed: number;
    itemsWasted: number;
    totalMoneySaved: number; // 🆕
    totalCo2Saved: number;   // 🆕
}

interface Props {
    ecoPoints: number;
    history: PointHistory[]; // 🆕 真实历史数据
    efficiency: EfficiencyStats; // 🆕 真实效率数据
}

export const ImpactDashboard = ({ ecoPoints, history, efficiency }: Props) => {

    // --- 1. 处理环形图数据 (真实效率) ---
    const totalActions = efficiency.itemsConsumed + efficiency.itemsWasted;
    // 如果没有任何操作，默认为 1 (100%) 以免图表难看，或者显示 0
    const successRate = totalActions > 0
        ? efficiency.itemsConsumed / totalActions
        : 0;

    const ringData = {
        labels: ["Efficiency"],
        data: [successRate]
    };

    // --- 2. 处理折线图数据 (真实历史) ---
    // 我们需要把 history 数组 (可能有很多条) 转换成最近 6 个点的趋势
    const processChartData = () => {
        if (!history || history.length === 0) {
            // 如果没有历史，显示一个基准点 (0)
            return {
                labels: ["Now"],
                datasets: [{ data: [0], color: () => `rgba(245, 158, 11, 1)`, strokeWidth: 2 }]
            };
        }

        // 取最近的 6 条记录 (或者按日期聚合，这里简化为取最后 6 次变化)
        let recentHistory = history.slice(-6);

        // 🛠️ 防崩溃 + 优化视觉：如果只有 1 条记录，手动补一个“起点”
        if (recentHistory.length === 1) {
            recentHistory = [
                { points: 0, date: new Date(Date.now() - 86400000).toISOString() }, // 伪造一个昨天的0分起点
                recentHistory[0]
            ];
        }

        const labels = recentHistory.map(h => {
            const date = new Date(h.date);
            return `${date.getMonth() + 1}/${date.getDate()}`; // MM/DD
        });

        const dataPoints = recentHistory.map(h => h.points);

        return {
            labels,
            datasets: [{
                data: dataPoints,
                color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
                strokeWidth: 3
            }]
        };
    };

    const lineData = processChartData();

    const chartConfig = {
        backgroundGradientFrom: "#ffffff",
        backgroundGradientTo: "#ffffff",
        color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
        strokeWidth: 2,
        barPercentage: 0.5,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
        propsForDots: { r: "4", strokeWidth: "2", stroke: "#fff" }
    };

    return (
        <View className="mx-6 mt-6">
            <Text className="text-gray-400 font-pbold text-xs uppercase tracking-wider mb-3 ml-2">My Impact</Text>

            <View className="bg-white rounded-[30px] p-5">

                {/* 1. 核心指标 */}
                <View className="flex-row justify-between mb-6">
                    <View className="flex-1 bg-green-50 p-4 rounded-2xl mr-3 border border-green-100">
                        <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons name="cash-multiple" size={18} color="#15803d" />
                            <Text className="text-green-800 text-xs font-bold ml-1">MONEY SAVED</Text>
                        </View>
                        {/* 🆕 真实金额 */}
                        <Text className="text-2xl font-extrabold text-green-700">
                            ₸ {(efficiency.totalMoneySaved || 0).toLocaleString()}
                        </Text>
                        <Text className="text-green-600/70 text-[10px] mt-1">From saved food</Text>
                    </View>

                    <View className="flex-1 bg-blue-50 p-4 rounded-2xl border border-blue-100">
                        <View className="flex-row items-center mb-2">
                            <MaterialCommunityIcons name="leaf" size={18} color="#1d4ed8" />
                            <Text className="text-blue-800 text-xs font-bold ml-1">CO₂ REDUCED</Text>
                        </View>
                        {/* 🆕 真实碳排放 */}
                        <Text className="text-2xl font-extrabold text-blue-700">
                            {(efficiency.totalCo2Saved || 0).toFixed(1)} <Text className="text-base">kg</Text>
                        </Text>
                        <Text className="text-blue-600/70 text-[10px] mt-1">Carbon footprint</Text>
                    </View>
                </View>

                {/* 2. 真实趋势图 */}
                <View className="mb-6">
                    <View className="flex-row items-center justify-between mb-2 px-1">
                        <Text className="text-slate-700 font-pbold text-sm">Growth History</Text>
                    </View>

                    {history && history.length > 0 ? (
                        <LineChart
                            data={lineData}
                            width={screenWidth - 88}
                            height={180}
                            chartConfig={chartConfig}
                            bezier
                            style={{ borderRadius: 16, paddingRight: 40 }}
                            withVerticalLines={false}
                            withHorizontalLines={true}
                        />
                    ) : (
                        <View className="h-40 items-center justify-center bg-gray-50 rounded-2xl">
                            <Text className="text-gray-400 text-xs">Start saving food to see your growth!</Text>
                        </View>
                    )}
                </View>

                {/* 3. 真实效率 */}
                <View className="flex-row items-center border-t border-gray-100 pt-6">
                    <View className="items-center mr-6">
                        <ProgressChart
                            data={ringData}
                            width={100}
                            height={100}
                            strokeWidth={10}
                            radius={40}
                            chartConfig={{
                                ...chartConfig,
                                color: (opacity = 1) => successRate > 0.7 ? `rgba(34, 197, 94, ${opacity})` : `rgba(245, 158, 11, ${opacity})`,
                            }}
                            hideLegend={true}
                        />
                        <View className="absolute inset-0 items-center justify-center pt-2">
                            <Text className="font-pbold text-slate-700 text-lg">{(successRate * 100).toFixed(0)}%</Text>
                        </View>
                        <Text className="text-[10px] text-gray-400 mt-1 font-pbold">EFFICIENCY</Text>
                    </View>

                    <View className="flex-1">
                        <Text className="text-slate-800 font-pbold text-base mb-1">
                            {successRate > 0.8 ? "Waste Warrior! 🛡️" : "Keep Going! 🌱"}
                        </Text>
                        <Text className="text-gray-500 text-xs leading-5">
                            You have saved <Text className="text-green-600 font-bold">{efficiency.itemsConsumed}</Text> items and wasted <Text className="text-red-500 font-bold">{efficiency.itemsWasted}</Text>.
                        </Text>
                    </View>
                </View>

            </View>
        </View>
    );
};