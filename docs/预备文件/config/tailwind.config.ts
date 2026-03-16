import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

/**
 * CyberGeek 宇宙博客 — Tailwind CSS 配置
 *
 * 设计语言：深空 + HUD + CRT 终端 + 赛博朋克
 * 主色调：冷蓝/青 + 紫/品红
 * 背景：真实深空色（参考 NASA 深场照片）
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  darkMode: "class",

  theme: {
    extend: {
      /* ────────────────────────────────────────
       * 调色板
       * ──────────────────────────────────────── */
      colors: {
        cosmic: {
          /** 深空背景 — 页面底色、全局背景
           *  取自 NASA 深空照片典型色域 */
          void: {
            DEFAULT: "#0a0a1a",
            50: "#e8e8f0",
            100: "#c5c5d6",
            200: "#9e9ebc",
            300: "#7474a0",
            400: "#50508a",
            500: "#2d2d6e",
            600: "#1a1a40",
            700: "#12122e",
            800: "#0b0d17",
            900: "#070710",
            950: "#05050f",
          },

          /** 星云紫 — 分类标签、hover 高亮、装饰性元素 */
          nebula: {
            DEFAULT: "#7c3aed",
            50: "#f3eeff",
            100: "#e9dfff",
            200: "#d5c0ff",
            300: "#b794ff",
            400: "#9f66ff",
            500: "#7c3aed",
            600: "#6922d4",
            700: "#5618b0",
            800: "#471490",
            900: "#3a1175",
            950: "#22094a",
          },

          /** 脉冲蓝/青 — 主按钮、链接、进度条、主交互色 */
          glow: {
            DEFAULT: "#06b6d4",
            50: "#ecfeff",
            100: "#cffafe",
            200: "#a5f3fc",
            300: "#67e8f9",
            400: "#22d3ee",
            500: "#06b6d4",
            600: "#0891b2",
            700: "#0e7490",
            800: "#155e75",
            900: "#164e63",
            950: "#083344",
          },

          /** 等离子粉/品红 — 强调、标注、创意类标签 */
          plasma: {
            DEFAULT: "#d946ef",
            50: "#fdf4ff",
            100: "#fae8ff",
            200: "#f5d0fe",
            300: "#f0abfc",
            400: "#e879f9",
            500: "#d946ef",
            600: "#c026d3",
            700: "#a21caf",
            800: "#86198f",
            900: "#701a75",
            950: "#4a044e",
          },

          /** 冰冻白/浅灰 — 正文文字、次要信息、分割线 */
          frost: {
            DEFAULT: "#e2e8f0",
            50: "#f8fafc",
            100: "#f1f5f9",
            200: "#e2e8f0",
            300: "#cbd5e1",
            400: "#94a3b8",
            500: "#64748b",
            600: "#475569",
            700: "#334155",
            800: "#1e293b",
            900: "#0f172a",
            950: "#020617",
          },

          /** 琥珀/橙 — 警告、强调、星标、收藏 */
          amber: {
            DEFAULT: "#f59e0b",
            50: "#fffbeb",
            100: "#fef3c7",
            200: "#fde68a",
            300: "#fcd34d",
            400: "#fbbf24",
            500: "#f59e0b",
            600: "#d97706",
            700: "#b45309",
            800: "#92400e",
            900: "#78350f",
            950: "#451a03",
          },

          /** 冰蓝 CRT — 终端文字、代码行号、命令提示符 */
          crt: "#00d4ff",

          /** 红色 — 错误、黑洞告警、删除确认 */
          danger: {
            DEFAULT: "#ef4444",
            50: "#fef2f2",
            100: "#fee2e2",
            200: "#fecaca",
            300: "#fca5a5",
            400: "#f87171",
            500: "#ef4444",
            600: "#dc2626",
            700: "#b91c1c",
            800: "#991b1b",
            900: "#7f1d1d",
            950: "#450a0a",
          },
        },

        /* One Dark Pro 代码主题色 */
        onedark: {
          bg: "#282c34",
          fg: "#abb2bf",
          red: "#e06c75",
          green: "#98c379",
          yellow: "#e5c07b",
          blue: "#61afef",
          magenta: "#c678dd",
          cyan: "#56b6c2",
          gutter: "#4b5263",
          comment: "#5c6370",
          selection: "#3e4451",
        },
      },

      /* ────────────────────────────────────────
       * 字体族
       * ──────────────────────────────────────── */
      fontFamily: {
        /** 中文正文 — 霞鹜文楷 */
        wenkai: ['"LXGW WenKai"', '"LXGW WenKai Screen"', "serif"],
        /** 西文正文 */
        inter: ["Inter", "system-ui", "sans-serif"],
        /** 正文混排：西文 Inter + 中文霞鹜文楷 */
        body: [
          "Inter",
          '"LXGW WenKai"',
          '"LXGW WenKai Screen"',
          "system-ui",
          "sans-serif",
        ],
        /** 标题 — Space Grotesk */
        heading: ['"Space Grotesk"', "Inter", "system-ui", "sans-serif"],
        /** 代码 / HUD 数据面板 */
        mono: ['"JetBrains Mono"', "Consolas", "monospace"],
      },

      /* ────────────────────────────────────────
       * 背景图片 — 深空渐变
       * ──────────────────────────────────────── */
      backgroundImage: {
        "deep-space":
          "radial-gradient(ellipse at 20% 50%, #0b0d17 0%, #05050f 60%, #000000 100%)",
        "nebula-glow":
          "radial-gradient(ellipse at 70% 30%, rgba(124,58,237,0.15) 0%, transparent 60%)",
        "crt-gradient":
          "linear-gradient(180deg, rgba(0,212,255,0.08) 0%, transparent 40%, transparent 60%, rgba(0,212,255,0.04) 100%)",
      },

      /* ────────────────────────────────────────
       * 毛玻璃 — HUD 面板模糊强度
       * ──────────────────────────────────────── */
      backdropBlur: {
        xs: "2px",
        hud: "12px",
        "hud-heavy": "20px",
      },

      /* ────────────────────────────────────────
       * 边框半径
       * ──────────────────────────────────────── */
      borderRadius: {
        hud: "6px",
      },

      /* ────────────────────────────────────────
       * 阴影 — 发光效果
       * ──────────────────────────────────────── */
      boxShadow: {
        "glow-blue": "0 0 15px rgba(6,182,212,0.35), 0 0 40px rgba(6,182,212,0.15)",
        "glow-purple":
          "0 0 15px rgba(124,58,237,0.35), 0 0 40px rgba(124,58,237,0.15)",
        "glow-plasma":
          "0 0 15px rgba(217,70,239,0.35), 0 0 40px rgba(217,70,239,0.15)",
        "glow-crt": "0 0 10px rgba(0,212,255,0.4), 0 0 30px rgba(0,212,255,0.15)",
        "glow-amber":
          "0 0 15px rgba(245,158,11,0.35), 0 0 40px rgba(245,158,11,0.15)",
        "glow-danger":
          "0 0 15px rgba(239,68,68,0.35), 0 0 40px rgba(239,68,68,0.15)",
        /** 内嵌发光 — 用于激活/选中态 */
        "inner-glow-blue": "inset 0 0 20px rgba(6,182,212,0.15)",
        "inner-glow-purple": "inset 0 0 20px rgba(124,58,237,0.15)",
      },

      /* ────────────────────────────────────────
       * 动画 keyframes
       * ──────────────────────────────────────── */
      keyframes: {
        /** 脉冲呼吸 — 在线状态、加载指示 */
        pulse_glow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        /** 扫描线向下滚动 */
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        /** 粒子凝聚 — 页面切换时粒子汇聚效果 */
        particle_converge: {
          "0%": { transform: "translate(var(--px), var(--py)) scale(0)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "translate(0, 0) scale(1)", opacity: "1" },
        },
        /** 星光闪烁 — 背景装饰 */
        twinkle: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" },
        },
        /** 浮动 — 卡片、图标轻微上下浮动 */
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
        /** 打字机 — CRT 终端打字效果 */
        typing: {
          from: { width: "0" },
          to: { width: "100%" },
        },
        /** 光标闪烁 — CRT 终端光标 */
        blink_caret: {
          "0%, 100%": { borderColor: "transparent" },
          "50%": { borderColor: "#00d4ff" },
        },
        /** 故障闪烁 — 404 页面 glitch 效果 */
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-2px, 2px)" },
          "40%": { transform: "translate(-2px, -2px)" },
          "60%": { transform: "translate(2px, 2px)" },
          "80%": { transform: "translate(2px, -2px)" },
        },
      },

      animation: {
        "pulse-glow": "pulse_glow 2s ease-in-out infinite",
        scanline: "scanline 8s linear infinite",
        "particle-converge": "particle_converge 1.2s cubic-bezier(0.25,0.46,0.45,0.94) forwards",
        twinkle: "twinkle 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        typing: "typing 2s steps(30) forwards",
        "blink-caret": "blink_caret 0.75s step-end infinite",
        glitch: "glitch 0.3s ease-in-out infinite",
      },

      /* ────────────────────────────────────────
       * 排版插件扩展
       * ──────────────────────────────────────── */
      typography: {
        cosmic: {
          css: {
            "--tw-prose-body": "#e2e8f0",
            "--tw-prose-headings": "#f8fafc",
            "--tw-prose-lead": "#94a3b8",
            "--tw-prose-links": "#06b6d4",
            "--tw-prose-bold": "#f8fafc",
            "--tw-prose-counters": "#64748b",
            "--tw-prose-bullets": "#06b6d4",
            "--tw-prose-hr": "#1e293b",
            "--tw-prose-quotes": "#e2e8f0",
            "--tw-prose-quote-borders": "#7c3aed",
            "--tw-prose-captions": "#64748b",
            "--tw-prose-code": "#00d4ff",
            "--tw-prose-pre-code": "#abb2bf",
            "--tw-prose-pre-bg": "#282c34",
            "--tw-prose-th-borders": "#334155",
            "--tw-prose-td-borders": "#1e293b",
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            a: {
              textDecoration: "none",
              borderBottom: "1px solid rgba(6,182,212,0.3)",
              transition: "border-color 0.2s, color 0.2s",
              "&:hover": {
                borderBottomColor: "#06b6d4",
                color: "#22d3ee",
              },
            },
            blockquote: {
              borderLeftColor: "#7c3aed",
              backgroundColor: "rgba(124,58,237,0.06)",
              borderRadius: "0 6px 6px 0",
              padding: "0.75em 1em",
            },
            pre: {
              borderRadius: "6px",
              border: "1px solid #3e4451",
            },
          },
        },
      },
    },
  },

  /* ────────────────────────────────────────
   * 自定义工具类插件
   * ──────────────────────────────────────── */
  plugins: [
    require("@tailwindcss/typography"),

    plugin(function ({ addUtilities, addComponents, theme }) {
      /* ── 毛玻璃 HUD 面板 ── */
      addComponents({
        ".hud-panel": {
          background: "rgba(10,10,26,0.65)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(6,182,212,0.2)",
          borderRadius: theme("borderRadius.hud") ?? "6px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        },
        ".hud-panel-purple": {
          background: "rgba(10,10,26,0.65)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(124,58,237,0.25)",
          borderRadius: theme("borderRadius.hud") ?? "6px",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
        },
      });

      /* ── 发光文字 ── */
      addUtilities({
        ".text-glow": {
          textShadow: "0 0 8px rgba(6,182,212,0.6), 0 0 20px rgba(6,182,212,0.3)",
        },
        ".text-glow-purple": {
          textShadow: "0 0 8px rgba(124,58,237,0.6), 0 0 20px rgba(124,58,237,0.3)",
        },
        ".text-glow-plasma": {
          textShadow: "0 0 8px rgba(217,70,239,0.6), 0 0 20px rgba(217,70,239,0.3)",
        },
        ".text-glow-crt": {
          textShadow: "0 0 8px rgba(0,212,255,0.7), 0 0 20px rgba(0,212,255,0.4)",
        },
        ".text-glow-amber": {
          textShadow: "0 0 8px rgba(245,158,11,0.6), 0 0 20px rgba(245,158,11,0.3)",
        },
        ".text-glow-danger": {
          textShadow: "0 0 8px rgba(239,68,68,0.6), 0 0 20px rgba(239,68,68,0.3)",
        },
      });

      /* ── 扫描线叠加 ── */
      addUtilities({
        ".scanline": {
          position: "relative",
          overflow: "hidden",
          "&::after": {
            content: '""',
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.03) 2px, rgba(0,212,255,0.03) 4px)",
            pointerEvents: "none",
            zIndex: "10",
          },
        },
      });

      /* ── 点线发光边框 ── */
      addUtilities({
        ".border-dotted-glow": {
          borderStyle: "dotted",
          borderWidth: "1px",
          borderColor: "rgba(6,182,212,0.4)",
          boxShadow: "0 0 6px rgba(6,182,212,0.15)",
        },
        ".border-dotted-glow-purple": {
          borderStyle: "dotted",
          borderWidth: "1px",
          borderColor: "rgba(124,58,237,0.4)",
          boxShadow: "0 0 6px rgba(124,58,237,0.15)",
        },
      });
    }),
  ],
};

export default config;
