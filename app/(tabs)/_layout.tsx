import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { View } from "react-native";

// 这是一个辅助函数，用来决定渲染哪个图标
// 我们混合使用了 Ionicons (首页/人) 和 MaterialCommunityIcons (冰箱/扫码)
const TabIcon = ({ focused, color, size, iconName, library = "Ionicons" }: any) => {
  if (library === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
  }
  return <Ionicons name={iconName} size={size} color={color} />;
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#22C55E", // 选中颜色：主色绿 (Primary)
        tabBarInactiveTintColor: "#9F9F9F", // 未选中颜色：灰色 (Gray-400)
        tabBarShowLabel: true, // 显示文字标签
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 70, // 增加高度，给中间的按钮留空间
          borderTopLeftRadius: 20, // 左上圆角
          borderTopRightRadius: 20, // 右上圆角
          borderTopWidth: 0, // 去掉顶部的细线
          // elevation: 10, // Android 阴影
          // shadowColor: "#000", // iOS 阴影
          //shadowOffset: { width: 0, height: -2 },
          //shadowOpacity: 0.1,
          //shadowRadius: 4,
          position: "absolute", // 绝对定位，为了更好看的圆角效果
          bottom: 0,
          paddingBottom: 10, // 把图标稍微往上推一点，防止贴底
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "500",
          marginBottom: 5,
        },
      }}
    >
      {/* 1. 首页 Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              iconName={focused ? "home" : "home-outline"} // 选中实心，未选中空心
              library="Ionicons"
            />
          ),
        }}
      />

      {/* 2. 冰箱 Fridge */}
      <Tabs.Screen
        name="fridge"
        options={{
          title: "Fridge",
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

      {/* 3. 扫描 Scan (核心悬浮按钮) */}
      <Tabs.Screen
        name="scan"
        options={{
          title: "", // 中间按钮通常不显示文字，或者文字很难对齐
          tabBarIcon: ({ focused }) => (
            <View
              className="items-center justify-center rounded-full bg-primary"
              style={{
                width: 64, // 按钮宽度
                height: 64, // 按钮高度
                marginBottom: 30, // 关键：把按钮往上顶，让它悬浮
                borderWidth: 4, // 白色边框，制造一种“镂空”感
                borderColor: "white",
              }}
            >
              <MaterialCommunityIcons name="barcode-scan" size={30} color="white" />
            </View>
          ),
        }}
      />

      {/* 4. 临期 Expiring */}
      <Tabs.Screen
        name="expiring"
        options={{
          title: "Expiring",
          tabBarIcon: ({ focused, color }) => (
            <TabIcon
              focused={focused}
              color={color}
              size={24}
              // 使用时钟图标，MCI 的 clock-time-four 比较好看
              iconName={focused ? "clock" : "clock-outline"}
              library="MaterialCommunityIcons"
            />
          ),
        }}
      />

      {/* 5. 个人中心 Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
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