/** @type {import('tailwindcss').Config} */
module.exports = {
  // 注意：这里配置了它需要扫描的文件路径（app 目录和 components 目录）
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        // 这里的 Key (pregular) 是你在 className 中用的名字
        // 这里的 Value ("Poppins-Regular") 必须和你 _layout.tsx 里 useFonts 的 Key 一致
        pthin: ["Poppins-Thin", "sans-serif"],
        pregular: ["Poppins-Regular", "sans-serif"],
        pmedium: ["Poppins-Medium", "sans-serif"],
        psemibold: ["Poppins-SemiBold", "sans-serif"],
        pbold: ["Poppins-Bold", "sans-serif"],
      },
      colors: {
        // === 主色系 ===
        primary: {
          DEFAULT: "#22C55E", // 核心主色 (绿色，用于主按钮、Header背景)
          light: "#DCFCE7",   // 浅绿色 (用于浅色背景)
          dark: "#15803D",    // 深绿色 (用于点击态或深色文字)
        },

        // === 辅色系 (比如 Sign Up 页面的橙色按钮) ===
        secondary: {
          DEFAULT: "#E87400", // 活力橙 (用于强调、CTA按钮)
          light: "#FFEDD5",
          dark: "#E84900",
          middle: "#F59E0B"
        },

        // === 功能色 ===
        danger: "#EF4444",    // 红色 (用于删除、警告、过期)
        gray: {
          50: "#F9FAFB",      // 极浅背景
          100: "#F3F4F6",     // 输入框背景
          400: "#9CA3AF",     // 图标颜色
          600: "#4B5563",     // 正文颜色
          800: "#1F2937",     // 标题颜色
        }
      },
    },
  },
  plugins: [],
}