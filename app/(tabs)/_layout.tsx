import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useFridgeInit } from "../../hooks/useFridgeInit";
import { translations } from "@/i18n/translations";
import { useUserStore } from "@/store/userStore";

const TabIcon = ({ focused, color, size, iconName, library = "Ionicons" }: any) => {
  if (library === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }
  return <Ionicons name={iconName} size={size} color={color} />;
};

export default function TabLayout() {
  const { language } = useUserStore();
  const t = translations[language];
  useFridgeInit();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#9F9F9F",
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0,
          position: "absolute",
          bottom: 0,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.home, // 现在 t 可以正常访问了
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              iconName={focused ? "home" : "home-outline"}
              library="Ionicons"
            />
          ),
        }}
      />

      {/* 其他 Tabs.Screen 保持不变... */}
      {/* 注意：你在 scan 的 options 里写了 tabBarStyle: { display: 'none' }，
          这会导致进入扫码页时底部栏消失，是正确的做法 */}
      <Tabs.Screen
        name="fridge"
        options={{
          title: t.fridge,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              iconName={focused ? "fridge" : "fridge-outline"}
              library="MaterialCommunityIcons"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: "",
          tabBarIcon: ({ focused }) => (
            <View
              className="items-center justify-center rounded-full bg-primary"
              style={{
                width: 64,
                height: 64,
                marginBottom: 30,
                borderWidth: 4,
                borderColor: "white",
              }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={30} color="white" />
            </View>
          ),
          tabBarStyle: { display: 'none' },
        }}
      />

      <Tabs.Screen
        name="expiring"
        options={{
          title: t.expiringTab,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              iconName={focused ? "clock" : "clock-outline"}
              library="MaterialCommunityIcons"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              iconName={focused ? "person" : "person-outline"}
              library="Ionicons"
            />
          ),
        }}
      />
    </Tabs>
  );
}