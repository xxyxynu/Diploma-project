import { notificationApi } from "@/api/notification";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { foodApi, FridgeItem, ItemStats } from "../../api/food";
import { CategoryIcon } from "../../components/CategoryIcon";
import { FoodItemCard } from "../../components/FoodItemCard";
import { FridgeSwitcherButton } from "../../components/FridgeSwitcher";
import { useFridgeInit } from "../../hooks/useFridgeInit";
import { useFridgeStore } from "../../store/fridgeStore";
import { useUserStore, Language } from "../../store/userStore";
import { translations } from "@/i18n/translations";
import Toast from "react-native-toast-message";

export default function Home() {
  const router = useRouter();
  const { userInfo, language } = useUserStore();
  const { selectedFridge } = useFridgeStore(); //Get selected fridge
  const { loadFridges } = useFridgeInit(); // Initialize fridges

  const t = translations[language];

  // State
  const [stats, setStats] = useState<ItemStats>({ total: 0, fresh: 0, expiring: 0, expired: 0 });
  const [itemsByCategory, setItemsByCategory] = useState<Record<string, FridgeItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [hasUnread, setHasUnread] = useState(false);

  // Fetch data when fridge changes
  useEffect(() => {
    if (selectedFridge) {
      fetchData();
    }
  }, [selectedFridge]); //Refetch when fridge changes

  useFocusEffect(
    useCallback(() => {
      checkUnreadNotifications();
    }, [])
  );

  const checkUnreadNotifications = async () => {
    try {
      // 获取所有通知
      const notifications = await notificationApi.getAll();
      // 检查是否有 isRead === false 的
      const unread = notifications.some(n => !n.isRead);
      setHasUnread(unread);
    } catch (error) {
      console.error("Failed to check notifications");
    }
  };

  const fetchData = async () => {
    if (!selectedFridge) {
      setLoading(false);
      return;
    }

    try {
      //Pass fridgeId to all API calls
      const [statsData, categoryData] = await Promise.all([
        foodApi.getStats(selectedFridge._id),
        foodApi.getByCategory(selectedFridge._id)
      ]);

      setStats(statsData);
      setItemsByCategory(categoryData);
    } catch (error: any) {
      console.error('Failed to fetch data:', error);
      Alert.alert('Error', 'Failed to load your fridge data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadFridges(); // Reload fridges too
    fetchData();
    checkUnreadNotifications();
  };

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    Alert.alert(
      "Delete Item",
      `Remove ${itemName} from your fridge?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await foodApi.delete(itemId);
              Toast.show({
                type: 'success',
                text1: t.deleteSuccess || "Deleted",
                text2: itemName
              });
              fetchData();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: t.detailError,
                text2: t.failedRemoveItem
              });
            }
          }
        }
      ]
    );
  };

  const handleScanReceipt = async () => {
    if (!selectedFridge) {
      Toast.show({
        type: 'info',
        text1: t.detailError,
        text2: t.noFridgeSelected
      });
      return;
    }

    try {
      // 请求权限
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: t.cameraPermissionDenied,
          text2: t.cameraPermissionMsg
        });
        return;
      }

      // 打开相机 (或者从相册选，看你需求)
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.1, // 极限压缩
        allowsEditing: true, // 允许裁剪小票
        aspect: [3, 4],
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;

        // 🚀 核心跳转：带上图片去审核页
        router.push({
          pathname: "/receipt-review",
          params: { base64: base64Img }
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t.detailError,
        text2: t.failedOpenCamera
      });
    }
  };

  // Show loading or no fridge message
  if (loading) {
    return (
      <View className="flex-1 bg-[#F8F9FA] items-center justify-center">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-gray-500 mt-4 font-pmedium">{t.loadingFridge}</Text>
      </View>
    );
  }

  if (!selectedFridge) {
    return (
      <View className="flex-1 bg-[#F8F9FA] items-center justify-center p-6">
        <MaterialCommunityIcons name="fridge-off-outline" size={80} color="#9CA3AF" />
        <Text className="text-xl font-pbold text-gray-800 mt-4 mb-2">{t.noFridgeSelected}</Text>
        <Text className="text-gray-500 text-center mb-6">
          {t.getStartedFridge}
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/fridge-management/create")}
          className="bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-pbold">{t.createFridge}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const categories = Object.keys(itemsByCategory);
  const previewCategories = categories.slice(0, 2);

  return (
    <View className="flex-1 bg-[#F8F9FA]">

      {/* --- Header Area --- */}
      <View className="bg-primary pt-20 pb-6 px-6 rounded-b-[30px] relative overflow-hidden shadow-sm">
        <MaterialCommunityIcons name="leaf" size={140} color="white" style={{ position: 'absolute', right: -30, bottom: -20, opacity: 0.1, transform: [{ rotate: '-15deg' }] }} />
        <MaterialCommunityIcons name="food-apple" size={100} color="white" style={{ position: 'absolute', left: -20, top: 20, opacity: 0.1, transform: [{ rotate: '15deg' }] }} />

        <View className="flex-row justify-between items-start mb-4">
          <View>
            <Text className="text-white text-3xl font-extrabold tracking-wide">EcoCart</Text>
            <Text className="text-green-50 text-sm font-medium mt-1">
              {t.greeting(userInfo?.name?.split(' ')[0] || 'there')}
            </Text>
          </View>
          {/* 🔔 铃铛按钮区域 */}
          <TouchableOpacity
            onPress={() => router.push("/notifications")}
            className="bg-white/20 p-2 rounded-full backdrop-blur-md relative" // relative 为红点定位做准备
          >
            <Ionicons name="notifications" size={24} color="white" />

            {/* 🔴 小红点 (只在有未读消息时显示) */}
            {hasUnread && (
              <View className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white/20" />
            )}
          </TouchableOpacity>
        </View>

        {/* Fridge Switcher Button */}
        <View className="mb-3">
          <FridgeSwitcherButton />
        </View>

        {/* Stats Pills */}
        <View className="flex-row space-x-4 mt-2">
          <View className="bg-white/20 flex-row items-center px-4 py-2 rounded-full flex-1 justify-center backdrop-blur-md">
            <MaterialCommunityIcons name="chart-pie" size={16} color="white" />
            <Text className="text-white font-bold ml-2">{t.totalItemsCount(stats.total)}</Text>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/(tabs)/expiring")}
            className="bg-white/20 flex-row items-center px-4 py-2 rounded-full flex-1 justify-center backdrop-blur-md"
          >
            <MaterialCommunityIcons name="clock-alert" size={16} color="white" />
            <Text className="text-white font-bold ml-2">{t.expiringCount(stats.expiring)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- Scrollable Content Area --- */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22C55E" />
        }
      >

        {/* Quick Actions - 现代重构版 */}
        <View className="px-6 mt-8">
          <View className="flex-row justify-between items-end mb-4">
            <View>
              <Text className="text-2xl font-pbold text-slate-800">{t.quickActions}</Text>
              <Text className="text-gray-400 text-xs font-pmedium">{t.manageKitchen}</Text>
            </View>
          </View>

          <View className="flex-row gap-3 h-40">
            {/* 1. Shopping List - 大卡片 (强调核心功能) */}
            <TouchableOpacity
              onPress={() => router.push("/shopping-list")}
              activeOpacity={0.7}
              className="flex-[1.2] bg-blue-500 rounded-[32px] p-5 justify-between shadow-lg shadow-blue-200"
            >
              <View className="bg-white/20 w-10 h-10 rounded-2xl items-center justify-center">
                <Ionicons name="cart" size={22} color="white" />
              </View>
              <View>
                <Text className="text-white font-pbold text-lg">{t.shopping}</Text>
                <Text className="text-blue-100 text-[10px] font-pmedium">{t.syncFridge}</Text>
              </View>
            </TouchableOpacity>

            {/* 右侧两个垂直排列的小卡片 */}
            <View className="flex-1 gap-3">
              {/* 2. Share Food */}
              <TouchableOpacity
                onPress={() => router.push("/community")}
                activeOpacity={0.7}
                className="flex-1 bg-purple-100 rounded-[24px] p-4 flex-row items-center shadow-sm shadow-purple-100"
              >
                <View className="bg-white p-2 rounded-xl mr-3">
                  <MaterialCommunityIcons name="hand-heart" size={18} color="#A855F7" />
                </View>
                <Text className="text-purple-700 font-pbold text-xs flex-1">{t.share}</Text>
              </TouchableOpacity>

              {/* 3. Scan Receipt */}
              <TouchableOpacity
                onPress={handleScanReceipt}
                activeOpacity={0.7}
                className="flex-1 bg-amber-100 rounded-[24px] p-4 flex-row items-center shadow-sm shadow-amber-100"
              >
                <View className="bg-white p-2 rounded-xl mr-3">
                  <Ionicons name="receipt" size={18} color="#D97706" />
                </View>
                <Text className="text-amber-700 font-pbold text-xs">OCR</Text>
                <View className="absolute -top-2 -right-1 bg-red-500 px-2 py-0.5 rounded-full">
                  <Text className="text-white text-[8px] font-pbold">FAST</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Empty State */}
        {stats.total === 0 && (
          <View className="px-6 mt-12 items-center">
            <View className="w-32 h-32 bg-gray-100 rounded-full items-center justify-center mb-4">
              <MaterialCommunityIcons name="fridge-outline" size={64} color="#9CA3AF" />
            </View>
            <Text className="text-xl font-pbold text-gray-800 mb-2">{t.emptyFridgeTitle}</Text>
            <Text className="text-gray-500 text-center mb-6">
              {t.emptyFridgeSub}
            </Text>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/scan")}
              className="bg-primary px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-pbold">{t.scanFirstItem}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Category Sections */}
        {previewCategories.map((category) => {
          const items = itemsByCategory[category].slice(0, 3);
          const hasMore = itemsByCategory[category].length > 3;

          return (
            <View key={category} className="px-6 mt-8">
              <View className="flex-row justify-between items-center mb-3">
                <View className="flex-row items-center">
                  <CategoryIcon category={category} />
                  <Text className="text-lg font-bold text-gray-800 ml-2">{t.categories[category as keyof typeof t.categories] || category}</Text>
                  <View className="bg-gray-200 px-2 py-0.5 rounded-full ml-2">
                    <Text className="text-gray-600 text-xs font-bold">
                      {itemsByCategory[category].length}
                    </Text>
                  </View>
                </View>
                {hasMore && (
                  <TouchableOpacity onPress={() => router.push("/(tabs)/fridge")}>
                    <Text className="text-primary text-sm font-pbold">{t.viewAll}</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="space-y-3">
                {items.map((item) => (
                  <FoodItemCard
                    key={item._id}
                    item={item}
                    onPress={() => router.push({ pathname: "/food/[id]", params: { id: item._id } })}
                    onDelete={() => handleDeleteItem(item._id, item.name)}
                    showDeleteButton={false}
                  />
                ))}
              </View>
            </View>
          );
        })}

        {/* View All Button */}
        {stats.total > 0 && (
          <View className="px-6 mt-8">
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/fridge")}
              className="bg-white py-4 rounded-2xl flex-row items-center justify-center"
            >
              <MaterialCommunityIcons name="fridge" size={20} color="#22C55E" />
              <Text className="text-primary font-pbold ml-2">{t.viewFullFridge}</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </View>
  );
}