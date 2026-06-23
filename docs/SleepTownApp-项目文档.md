# SleepTown App - 跨平台推理游戏 📱

> **项目类型**: React Native + Expo 跨平台移动应用  
> **开发时间**: 2026-06-23 开始  
> **技术栈**: React Native 0.85.3 + Expo SDK 56 + TypeScript 6.0  
> **GitHub仓库**: https://github.com/106-official/SleepTownApp  
> **当前版本**: v0.1.0 (基础架构)  
> **状态**: 🚧 开发中 - Phase 1: 单机版  

---

## 📖 项目概述

### 🎯 项目目标
将现有的**SleepTown网页版推理游戏**移植为**跨平台移动应用**，并逐步添加联网功能，打造完整的移动端游戏体验。

### 🔄 与网页版的关系
- **源项目**: [SleepTown 网页版](https://deepsleep.fun/play/sleeptown/) (位于 `blog-static/layouts/_default/sleeptown.html`)
- **定位**: 网页版的移动端增强版，保留核心玩法，优化交互体验，新增社交功能
- **数据**: 关卡配置、角色系统、游戏逻辑将完全复用网页版设计

### ✨ 当前版本特色 (v0.1.0)

- **🎨 专业UI设计**: 渐变背景、卡片布局、Material Design规范
- **🧭 完整导航**: 3个页面无缝跳转（首页→关卡选择→游戏界面）
- **🌈 主题系统**: 支持亮色/暗色模式切换
- **📱 原生体验**: React Native原生组件，流畅的动画效果
- **⚡ TypeScript支持**: 完整类型定义，减少运行时错误
- **🔧 生产级架构**: 可扩展的目录结构和代码组织

---

## 🛠️ 技术栈详解

### 核心框架

| 技术 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| **React Native** | 0.85.3 | 跨平台UI框架 | Facebook维护，生态成熟，性能优秀 |
| **Expo SDK** | 56.0.12 | 开发工具链 | 简化配置，OTA更新，无需原生代码 |
| **TypeScript** | 6.0.3 | 类型安全语言 | 静态类型检查，IDE智能提示，减少bug |
| **React** | 19.2.3 | UI库 | 最新版本，Concurrent Mode等新特性 |

### 导航与路由

| 包名 | 版本 | 用途 | 说明 |
|------|------|------|------|
| `@react-navigation/native` | ^7.3.3 | 导航核心 | React Navigation官方推荐 |
| `@react-navigation/native-stack` | ^7.17.5 | 堆栈导航 | 原生堆栈导航器，性能好 |
| `react-native-screens` | ^4.25.2 | 原生屏幕优化 | 启用原生屏幕过渡动画 |
| `react-native-safe-area-context` | ^5.8.0 | 安全区处理 | 适配刘海屏、底部指示条 |

### UI组件库

| 包名 | 版本 | 用途 | 特点 |
|------|------|------|------|
| `react-native-paper` | ^5.15.3 | Material Design组件 | 组件丰富，主题定制灵活，文档完善 |
| `expo-linear-gradient` | ^56.0.4 | 渐变背景效果 | 用于首页渐变紫色背景 |

### 手势与交互

| 包名 | 版本 | 用途 | 必要性 |
|------|------|------|--------|
| `react-native-gesture-handler` | ^3.0.2 | 手势处理系统 | React Navigation必需依赖 |

### 状态管理（已安装待使用）

| 包名 | 版本 | 用途 | 选择理由 |
|------|------|------|---------|
| **zustand** | ^5.0.14 | 轻量状态管理 | API简洁（仅4个API），包体积小（1KB），TypeScript友好 |

### 本地存储（已安装待使用）

| 包名 | 版本 | 用途 | 应用场景 |
|------|------|------|---------|
| `@react-native-async-storage/async-storage` | ^3.1.1 | 持久化键值存储 | 保存游戏进度、用户设置、关卡解锁状态 |

### 其他依赖

| 包名 | 版本 | 用途 |
|------|------|------|
| `expo-status-bar` | ~56.0.4 | 状态栏样式控制 |

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    SleepTown App                            │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  App.tsx (入口)                      │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐    │   │
│  │  │         GestureHandlerRootView               │    │   │
│  │  │                                             │    │   │
│  │  │  ┌───────────────────────────────────────┐  │    │   │
│  │  │  │        PaperProvider (主题)            │  │    │   │
│  │  │  │                                       │  │    │   │
│  │  │  │  ┌─────────────────────────────────┐  │  │    │   │
│  │  │  │  │      AppNavigator (导航)        │  │  │    │   │
│  │  │  │  │                                 │  │  │    │   │
│  │  │  │  │  ┌───────────────────────────┐  │  │  │    │   │
│  │  │  │  │  │     Stack.Navigator       │  │  │  │    │   │
│  │  │  │  │  │                           │  │  │  │    │   │
│  │  │  │  │  │  ┌─────────────────────┐  │  │  │  │    │   │
│  │  │  │  │  │  │   HomeScreen        │  │  │  │  │    │   │
│  │  │  │  │  │  │   (首页)            │  │  │  │  │    │   │
│  │  │  │  │  │  └─────────────────────┘  │  │  │  │    │   │
│  │  │  │  │  │           ↓ navigate       │  │  │  │    │   │
│  │  │  │  │  │  ┌─────────────────────┐  │  │  │  │    │   │
│  │  │  │  │  │  │ StageSelectScreen   │  │  │  │  │    │   │
│  │  │  │  │  │  │ (关卡选择)          │  │  │  │  │    │   │
│  │  │  │  │  │  └─────────────────────┘  │  │  │  │    │   │
│  │  │  │  │  │           ↓ navigate       │  │  │  │    │   │
│  │  │  │  │  │  ┌─────────────────────┐  │  │  │  │    │   │
│  │  │  │  │  │  │   GameScreen        │  │  │  │  │    │   │
│  │  │  │  │  │  │   (游戏界面)        │  │  │  │  │    │   │
│  │  │  │  │  │  └─────────────────────┘  │  │  │  │    │   │
│  │  │  │  │  └───────────────────────────┘  │  │  │    │   │
│  │  │  │  └─────────────────────────────────┘  │  │    │   │
│  │  │  └───────────────────────────────────────┘  │    │   │
│  │  └─────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  外层服务层（Phase 2+ 实现）                                │
│  ├── Zustand Store (全局状态管理)                           │
│  ├── AsyncStorage (本地数据持久化)                          │
│  └── Firebase (后端服务 - Phase 3)                         │
└─────────────────────────────────────────────────────────────┘
```

### 数据流架构（规划中）

```
用户操作 → UI组件 → Action → Store (Zustand) → 状态更新 → UI重新渲染
                ↓
         AsyncStorage (持久化)
                ↓
         Firebase (云端同步 - Phase 3)
```

### 页面导航流程

```
┌──────────┐    点击章节     ┌────────────────┐    点击关卡     ┌──────────┐
│          │ ──────────────→ │                │ ──────────────→ │          │
│ HomeScreen│               │StageSelectScreen│               │GameScreen │
│  (首页)   │ ←──────────── │  (关卡选择)     │ ←──────────── │ (游戏)   │
│          │    返回按钮     │                │    返回按钮    │          │
└──────────┘                └────────────────┘                └──────────┘
     ↑                            ↑                              ↑
     │                            │                              │
  参数: 无                    参数: {chapterId}              参数: {stageId, stageName}
```

---

## 📁 目录结构详解

```
SleepTownApp/
│
├── 📄 App.tsx                              # ⭐ 应用入口文件
│                                           # 配置根组件：GestureHandler + PaperProvider + Navigator
│
├── 📄 app.json                             # Expo配置文件
│                                           # 定义应用名称、图标、平台特定设置
│
├── 📄 package.json                         # NPM依赖配置
│                                           # 记录所有依赖包及其版本
│
├── 📄 package-lock.json                    # 依赖锁定文件
│                                           # 确保团队成员安装相同版本的依赖
│
├── 📄 tsconfig.json                        # TypeScript配置
│                                           # 编译选项、路径别名等
│
├── 📄 index.ts                             # Expo入口点
│                                           # 注册根组件
│
├── 📄 README.md                            # 项目文档
│                                           # GitHub仓库展示页
│
├── 📁 src/                                 # 🔧 源代码目录
│   │
│   ├── 📁 navigation/                      # 🧭 导航模块
│   │   └── 📄 AppNavigator.tsx             # ⭐ 导航配置中心
│   │                                       # 定义所有页面路由、参数类型、导航栏样式
│   │                                       # 类型导出：RootStackParamList（供各页面使用）
│   │
│   ├── 📁 screens/                         # 📱 页面组件
│   │   │
│   │   ├── 📄 HomeScreen.tsx               # ⭐ 首页
│   │   │                                   # 功能：显示欢迎信息、章节列表、进入关卡选择
│   │   │                                   # UI特点：渐变背景、Material Design卡片
│   │   │
│   │   ├── 📄 StageSelectScreen.tsx        # ⭐ 关卡选择页面
│   │   │                                   # 功能：显示某章节的所有关卡、难度星级、解锁状态
│   │   │                                   # 数据来源：stagesData常量（硬编码，后续改为动态加载）
│   │   │
│   │   └── 📄 GameScreen.tsx              # ⭐ 游戏主界面（原型）
│   │                                       # 功能：显示鱼群、阶段提示、操作按钮
│   │                                       # 当前状态：静态原型，待实现完整游戏逻辑
│   │
│   └── 📁 theme/                           # 🎨 主题配置
│       └── 📄 theme.ts                     # ⭐ 主题定义
│                                           # lightTheme: 亮色主题（当前使用）
│                                           # darkTheme: 暗色主题（待实现切换功能）
│                                           # 自定义颜色：primary(#667eea), secondary(#764ba2)
│
├── 📁 assets/                              # 🖼️ 静态资源
│   ├── icon.png                            # 应用图标
│   ├── splash-icon.png                     # 启动屏图标
│   ├── favicon.png                         # Web版favicon
│   ├── android-icon-*.png                  # Android自适应图标
│   └── ...                                 # 其他平台资源
│
├── 📁 .git/                                # Git版本控制
│
├── 📄 .gitignore                           # Git忽略规则
│
├── 📄 AGENTS.md                            # AI助手配置（Claude/Cursor）
│
└── 📄 CLAUDE.md                            # Claude AI指令文件
```

---

## 💻 核心代码解析

### 1️⃣ App.tsx - 应用入口

**文件位置**: [App.tsx](../App.tsx)  
**作用**: 应用的根组件，配置全局Provider  
**行数**: 15行

```typescript
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { lightTheme } from './src/theme/theme';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PaperProvider theme={lightTheme}>
        <AppNavigator />
      </PaperProvider>
    </GestureHandlerRootView>
  );
}
```

**关键点解析**:
1. **GestureHandlerRootView** (第9行): 
   - 必须包裹整个应用，否则手势处理会失效
   - 是 `react-native-gesture-handler` 的要求
   
2. **PaperProvider** (第10行):
   - 提供React Native Paper的主题上下文
   - 当前使用 `lightTheme`，可切换为 `darkTheme`
   
3. **组件层级顺序**:
   ```
   GestureHandlerRootView (最外层)
     └── PaperProvider (主题)
         └── AppNavigator (导航)
   ```

### 2️⃣ AppNavigator.tsx - 导航配置

**文件位置**: [src/navigation/AppNavigator.tsx](../src/navigation/AppNavigator.tsx)  
**作用**: 定义所有页面路由、参数类型、导航栏样式  
**行数**: 50行

#### 核心类型定义 (第7-11行)

```typescript
export type RootStackParamList = {
  Home: undefined;                              // 首页无参数
  StageSelect: { chapterId: string };          // 关卡选择需要章节ID
  Game: { stageId: string; stageName: string }; // 游戏页面需要关卡ID和名称
};
```

**重要性**: 这个类型定义是**类型安全导航的基础**！所有页面的 `navigation.navigate()` 都会受到TypeScript检查。

#### 导航器配置 (第17-29行)

```typescript
<Stack.Navigator
  initialRouteName="Home"                       // 默认首页
  screenOptions={{
    headerShown: true,                         // 显示导航栏
    headerStyle: {
      backgroundColor: '#667eea',             // 导航栏背景色（品牌紫）
    },
    headerTintColor: '#fff',                   // 导航栏文字颜色（白色）
    headerTitleStyle: {
      fontWeight: 'bold' as const,
      fontSize: 20,
    },
  }}
>
```

**样式说明**:
- 使用品牌色 `#667eea` 作为导航栏背景
- 白色文字保证对比度
- 所有页面统一此样式

#### 页面注册 (第31-46行)

```typescript
<Stack.Screen name="Home" component={HomeScreen} options={{ title: '🌙 SleepTown' }} />
<Stack.Screen name="StageSelect" component={StageSelectScreen} options={{ title: '选择关卡' }} />
<Stack.Screen name="Game" component={GameScreen} options={{ title: '游戏中' }} />
```

### 3️⃣ HomeScreen.tsx - 首页

**文件位置**: [src/screens/HomeScreen.tsx](../src/screens/HomeScreen.tsx)  
**作用**: 应用首页，展示欢迎信息和章节列表  
**行数**: 199行

#### Props类型定义 (第8-10行)

```typescript
type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};
```

**说明**: 通过泛型指定当前页面名称为 `'Home'`，这样 `navigation.navigate()` 只能导航到其他页面，不能再次导航到Home。

#### 数据结构 (第13-28行)

```typescript
const chapters = [
  {
    id: 'chapter-1',
    title: '📖 第1章 基础教学',
    description: '学习游戏基础规则和角色能力',
    stages: 8,                                  // 该章包含8个关卡
    difficulty: '⭐ 入门级',
  },
  // ...
];
```

**注意**: 当前为硬编码数据，**Phase 2将改为从配置文件或API动态加载**。

#### UI结构 (第30-96行)

```
LinearGradient (渐变背景 #667eea → #764ba2)
 └── ScrollView (可滚动容器)
      ├── View.header (头部区域)
      │   ├── Text.title ("🌙 SleepTown")
      │   └── Text.subtitle ("推理与 deception 的艺术")
      │
      └── View.content (内容区域, 圆角白色背景)
           ├── Card.introCard (欢迎卡片)
           │   └── Title + Paragraph
           │
           ├── Text.sectionTitle ("🎮 开始游戏")
           │
           ├── Card.chapterCard (章节卡片 x2)
           │   └── LinearGradient (内部渐变)
           │       ├── Title (章节标题)
           │       ├── Paragraph (描述)
           │       └── View.chapterInfo (关卡数 + 难度)
           │
           └── Button.settingsButton (设置按钮)
```

#### 样式亮点

**渐变背景** (第100-102行):
```typescript
gradient: {
  flex: 1,                                     // 占满整个屏幕
},
```

**内容区圆角** (第125-131行):
```typescript
content: {
  backgroundColor: '#f5f7fa',
  borderTopLeftRadius: 30,                     // 左上圆角30px
  borderTopRightRadius: 30,                    // 右上圆角30px
  marginTop: -30,                             // 向上偏移覆盖部分渐变区域
  // ...
},
```

**文字阴影** (第116-118行):
```typescript
title: {
  textShadowColor: 'rgba(0, 0, 0, 0.3)',
  textShadowOffset: { width: 2, height: 2 },
  textShadowRadius: 8,
},
```

#### 导航调用 (第58行)

```typescript
onPress={() => navigation.navigate('StageSelect', { chapterId: chapter.id })}
```

**参数传递**: 将 `chapterId` ('chapter-1' 或 'chapter-2') 传递给下一页面。

### 4️⃣ StageSelectScreen.tsx - 关卡选择页面

**文件位置**: [src/screens/StageSelectScreen.tsx](../src/screens/StageSelectScreen.tsx)  
**作用**: 显示某个章节的所有关卡  
**行数**: 172行

#### 接收路由参数 (第44-46行)

```typescript
const route = useRoute<StageSelectRouteProp>();
const { chapterId } = route.params;
const stages = stagesData[chapterId] || [];
```

**流程**:
1. 从路由获取 `chapterId` 参数
2. 根据 `chapterId` 在 `stagesData` 中查找对应关卡列表
3. 如果找不到则返回空数组

#### 关卡数据接口 (第14-20行)

```typescript
interface Stage {
  id: string;          // 关卡ID，如 "1-1"
  name: string;        // 关卡名称，如 "🔍 侦探的试炼"
  difficulty: number;  // 难度等级 (1-5星)
  description: string; // 关卡介绍
  unlocked: boolean;   // 是否解锁
}
```

#### 关卡数据存储 (第22-37行)

```typescript
const stagesData: Record<string, Stage[]> = {
  'chapter-1': [
    { id: '1-1', name: '🔍 侦探的试炼', difficulty: 1, description: '...', unlocked: true },
    // ... 共8个关卡
  ],
  'chapter-2': [
    { id: '2-1', name: '✝️ 殉道士', difficulty: 1, description: '...', unlocked: true },
    // ... 共2个关卡
  ],
};
```

**数据同步说明**: 此数据必须与网页版 [sleeptown.html](../../../blog-static/layouts/_default/sleeptown.html) 中的关卡配置保持一致！

#### 条件渲染 (第77-95行)

```typescript
{stage.unlocked ? (
  <Button mode="contained" onPress={() => navigation.navigate('Game', {...})}>
    ▶️ 开始挑战
  </Button>
) : (
  <View style={styles.lockedOverlay}>
    <Text style={styles.lockedText}>🔒 未解锁</Text>
  </View>
)}
```

**逻辑**: 
- 已解锁：显示"开始挑战"按钮
- 未解锁：显示锁定图标和文字，且整个Card的 `disabled={true}`

### 5️⃣ GameScreen.tsx - 游戏界面（原型）

**文件位置**: [src/screens/GameScreen.tsx](../src/screens/GameScreen.tsx)  
**作用**: 游戏主界面，当前为静态原型  
**行数**: 188行

#### 当前状态说明

**⚠️ 重要**: 此页面目前仅为**视觉原型**，所有数据都是硬编码的：
- 固定显示8只鱼
- 固定显示"白天阶段"、"第1天"
- 操作按钮只输出日志，未连接实际逻辑

**下一步工作**: 需要在此页面实现完整的游戏逻辑（参考网页版 sleeptown.html）。

#### 接收参数 (第15-16行)

```typescript
const { stageId, stageName } = route.params;
// 例如: stageId="1-1", stageName="🔍 侦探的试炼"
```

#### UI布局 (第18-86行)

```
View.container
 └── ScrollView
      ├── View.header (紫色背景头部)
      │   ├── Text.stageTitle (关卡名称)
      │   └── Text.stageId (关卡ID)
      │
      ├── Card.gameStatusCard (黄色边框 - 状态卡片)
      │   └── Text: "🌅 白天阶段 / 第1天 / 问询次数: 3"
      │
      ├── Card.playersCard (鱼群卡片)
      │   ├── Text.playersTitle ("🐟 鱼群 (8只)")
      │   └── View.playersGrid (网格布局)
      │       └── View.playerItem x8
      │           ├── Text.playerNumber (#1 ~ #8)
      │           └── Text.playerStatus ("存活")
      │
      ├── Card.actionCard (操作卡片)
      │   ├── Button: "❓ 问询鱼群" (蓝色)
      │   ├── Button: "🔥 流放嫌疑鱼" (红色)
      │   └── Button: "⏭️ 跳过流放" (轮廓按钮)
      │
      └── Button.backButton (返回按钮)
```

#### 样式特点

**状态卡片** (第112-120行):
```typescript
gameStatusCard: {
  backgroundColor: '#fff9e6',                 // 浅黄背景
  borderColor: '#ffd43b',                    // 黄色边框
  borderWidth: 2,
  elevation: 4,                               // Android阴影
},
```

**鱼群网格** (第143-155行):
```typescript
playersGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',                          // 自动换行
  justifyContent: 'space-between',            // 两端对齐
},
playerItem: {
  width: '22%',                               // 每行约4个 (100% / 4 ≈ 25%，留有间距)
  alignItems: 'center',
  backgroundColor: '#e8eaf6',                 // 浅蓝紫背景
  paddingVertical: 10,
  marginVertical: 5,
  borderRadius: 8,
},
```

### 6️⃣ theme.ts - 主题配置

**文件位置**: [src/theme/theme.ts](../src/theme/theme.ts)  
**作用**: 定义应用的亮色和暗色主题  
**行数**: 32行

#### 亮色主题 (第3-16行)

```typescript
export const lightTheme = {
  ...MD3LightTheme,                           // 继承Material Design 3默认亮色主题
  colors: {
    ...MD3LightTheme.colors,
    primary: '#667eea',                       // 主色调 - 品牌紫
    secondary: '#764ba2',                     // 辅助色 - 深紫
    background: '#f5f7fa',                    // 页面背景 - 浅灰
    surface: '#ffffff',                       // 卡片表面 - 白色
    text: '#333333',                          // 文字颜色 - 深灰
    error: '#ff6b6b',                         // 错误色 - 红色
    success: '#51cf66',                       // 成功色 - 绿色
    warning: '#ffd43b',                       // 警告色 - 黄色
  },
};
```

#### 暗色主题 (第18-31行)

```typescript
export const darkTheme = {
  ...MD3DarkTheme,                            // 继承Material Design 3默认暗色主题
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#667eea',                       // 保持品牌色一致
    secondary: '#764ba2',
    background: '#1a1a2e',                    // 深色背景 - 深蓝黑
    surface: '#16213e',                       // 卡片表面 - 更深的蓝
    text: '#e0e0e0',                          // 文字颜色 - 浅灰
    // error/success/warning 保持不变
  },
};
```

**颜色体系说明**:
- **Primary (#667eea)**: 品牌主色，用于按钮、导航栏、强调元素
- **Secondary (#764ba2)**: 辅助色，用于渐变、次要元素
- 这两个颜色组合形成标志性的**紫蓝渐变**

---

## 🎮 游戏逻辑规划（待实现）

### 核心状态结构设计（Zustand Store）

```typescript
// src/store/gameStore.ts (待创建)
interface GameState {
  // 游戏配置
  currentStage: string | null;
  players: Player[];
  roles: Role[];
  
  // 游戏流程
  phase: 'day' | 'night';          // 当前阶段
  dayCount: number;                 // 第几天
  inquiryCount: number;             // 剩余问询次数
  inquiriesToday: string[];        // 今天已问询的玩家ID
  
  // 玩家状态
  alivePlayers: string[];           // 存活玩家ID
  eliminatedPlayers: string[];      // 已淘汰玩家
  
  // 游戏结果
  gameResult: 'win' | 'lose' | null;
  
  // Actions
  startGame: (stageId: string) => void;
  inquirePlayer: (targetId: string) => InquiryResult;
  eliminatePlayer: (targetId: string) => void;
  nextPhase: () => void;
}
```

### 角色系统映射（来自网页版）

| 角色ID | 中文名称 | 阵营 | 能力简述 | App实现优先级 |
|--------|---------|------|---------|--------------|
| detective | 侦探D | 豪鱼 | 问询得知目标阵营 | P0 (必须) |
| judge | 法官D | 豪鱼 | 公布一个非好鱼编号 | P0 (必须) |
| sleepwalker | 梦游D | 豪鱼 | 梦到3个编号(含1坏鱼) | P0 (必须) |
| gossip | 八卦D | 豪鱼 | 探测相邻位置的坏鱼 | P1 (重要) |
| slacker | 摆烂D | 豪鱼 | 不提供有用信息 | P1 (重要) |
| evil | 邪恶D | 坏鱼 | 夜晚淘汰一只豪鱼 | P0 (必须) |
| prankster | 恶作剧D | 坏鱼 | 减少问询机会 | P1 (重要) |
| mage | 法师D | 中立 | 令一鱼特性失效 | P2 (可选) |
| martyr | 殉道D | 坏鱼 | 被流放时淘汰一只好鱼 | P2 (可选) |
| orca | 虎鲸 | 中立 | 无差别攻击 | P2 (可选) |

### 游戏流程状态机

```
[初始化] → [分配角色] → [第1天白天]
                        ↓
              ┌─── [问询阶段] ←──┐
              ↓                 │
         [流放投票阶段]         │ (重复问询直到用完次数)
              ↓                 │
         [夜晚阶段] ────────────┘
              ↓
         [结算] → [检查胜负]
                        ↓
              ┌─── [胜负未分] ──┐
              ↓                 │
        [第N+1天白天]      [游戏结束]
              ↓                 ↓
         (继续循环)        [显示结果]
```

---

## 🔄 与网页版的差异对比

### 架构差异

| 方面 | 网页版 | App版 |
|------|-------|-------|
| **技术栈** | HTML + CSS + JavaScript (单文件2800行) | React Native + TypeScript (多组件模块化) |
| **运行环境** | 浏览器 | 移动端原生渲染 |
| **状态管理** | 全局变量 + DOM操作 | Zustand Store |
| **路由** | 单页面切换显示/隐藏 | React Navigation堆栈导航 |
| **样式** | CSS (内联+类名) | StyleSheet + React Native Paper主题 |
| **存储** | 无 (每次刷新重置) | AsyncStorage (持久化) |
| **部署** | Hugo静态生成 + GitHub Pages | Expo构建 + 应用商店 |

### 功能差异（当前阶段）

| 功能 | 网页版 | App v0.1.0 | App v1.0.0 (计划) |
|------|-------|-----------|------------------|
| ✅ 基础UI | ✓ | ✓ (更精美) | ✓ |
| ✅ 关卡选择 | ✓ | ✓ | ✓ |
| ❌ 游戏逻辑 | ✓ | ✗ (原型) | ✓ |
| ❌ 角色能力 | ✓ | ✗ | ✓ |
| ❌ 问询机制 | ✓ | ✗ | ✓ |
| ❌ 流放投票 | ✓ | ✗ | ✓ |
| ❌ 进度保存 | ✗ | ✗ | ✓ (AsyncStorage) |
| ❌ 用户系统 | ✗ | ✗ | ✓ (Firebase Auth) |
| ❌ 多人对战 | ✗ | ✗ | ✓ (Firebase Realtime DB) |
| ❌ 排行榜 | ✗ | ✗ | ✓ (Firestore) |
| ❌ 成就系统 | ✗ | ✗ | ✓ |
| ❌ 社交分享 | ✗ | ✗ | ✓ (Share API) |
| ❌ 推送通知 | ✗ | ✗ | ✓ (FCM) |

### 代码质量提升

| 改进项 | 网页版问题 | App版解决方案 |
|--------|----------|-------------|
| **类型安全** | JavaScript动态类型，易出错 | TypeScript静态类型检查 |
| **组件复用** | 大量重复HTML片段 | React组件化，可复用 |
| **状态管理** | 全局变量污染 | Zustand集中式状态管理 |
| **代码组织** | 2800行单文件 | 多文件模块化，职责清晰 |
| **可维护性** | 修改困难，牵一发而全身 | 单一职责原则，易于修改 |
| **可测试性** | 无法单元测试 | 组件和逻辑分离，易于测试 |

---

## 📋 开发规范

### 命名规范

#### 文件命名
- **组件文件**: PascalCase (如 `HomeScreen.tsx`)
- **工具文件**: camelCase (如 `gameUtils.ts`)
- **常量文件**: UPPER_SNAKE_CASE (如 `ROLES_CONFIG.ts`)
- **类型文件**: PascalCase + Types后缀 (如 `GameTypes.ts`)

#### 变量/函数命名
- **组件**: PascalCase (`const HomeScreen: React.FC = ...`)
- **变量/函数**: camelCase (`const currentPlayer = ...`, `function inquirePlayer() {}`)
- **常量**: UPPER_SNAKE_CASE (`const MAX_PLAYERS = 20`)
- **类型/接口**: PascalCase (`interface Player { ... }`, `type Phase = 'day' | 'night'`)

#### 样式命名
- **对象**: camelCase (`const styles = StyleSheet.create({ ... })`)
- **属性**: camelCase (`container`, `headerTitle`, `buttonText`)

### 代码风格

#### 组件结构模板

```typescript
// 1. 导入
import React from 'react';
import { View, Text } from 'react-native';

// 2. 类型定义
type ComponentProps = {
  // ...
};

// 3. 组件声明
const ComponentName: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // 4. Hooks调用 (必须在顶层)
  const [state, setState] = React.useState();
  
  // 5. 事件处理函数
  const handlePress = () => { ... };
  
  // 6. JSX返回
  return (
    <View>
      {/* 内容 */}
    </View>
  );
};

// 7. 样式定义
const styles = StyleSheet.create({
  // ...
});

// 8. 导出
export default ComponentName;
```

#### 注释规范

```typescript
/**
 * 组件/函数的文档注释
 * @param param1 - 参数1说明
 * @returns 返回值说明
 */

// TODO: 待办事项 (临时注释)
// FIXME: 需要修复的问题
// HACK: 临时解决方案
// NOTE: 重要说明
```

### Git提交规范

采用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>
```

**Type类型**:
- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构（既不是新功能也不是修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

**示例**:
```
feat(game): 实现问询机制

- 添加inquirePlayer action
- 实现角色能力判断逻辑
- 添加问询结果UI展示

Closes #123
```

---

## ⚠️ 常见错误预防

基于网页版开发经验总结的常见问题和预防措施：

### 1️⃣ 数据同步错误

**问题描述**: App端关卡数据与网页版不一致

**网页版历史问题**:
- 关卡1-3曾因数组缺少元素而不显示
- 新增关卡时忘记更新关卡顺序数组

**预防措施**:
```typescript
// ✅ 正确做法：使用单一数据源
const STAGES_CONFIG = {
  'chapter-1': [...],  // 从配置文件或API统一加载
  'chapter-2': [...],
};

// ❌ 错误做法：在多个地方硬编码数据
const stagesInHomeScreen = [...];
const stagesInGameLogic = [...];
```

**验证方法**: 编写单元测试比对App端和网页端的关卡数据一致性。

### 2️⃣ 类型安全错误

**问题描述**: JavaScript动态类型导致的运行时错误

**网页版案例**:
- `undefined` 属性访问导致崩溃
- 类型混淆（字符串当数字使用）

**预防措施**:
```typescript
// ✅ 正确做法：严格的类型定义
interface Player {
  id: string;
  role: RoleType;          // 使用联合类型而非string
  isAlive: boolean;
}

function getPlayerRole(player: Player): RoleType {
  return player.role;      // TypeScript保证返回正确类型
}

// ❌ 错误做法：使用any或缺乏类型检查
function getRole(player: any): any {
  return player.role;      // 可能返回任何类型
}
```

### 3️⃣ 状态管理混乱

**问题描述**: 全局变量导致状态不可预测

**网页版问题**:
- 多处直接修改DOM
- 游戏状态分散在多个函数中

**预防措施**:
```typescript
// ✅ 正确做法：集中式状态管理
const useGameStore = create<GameState>((set, get) => ({
  players: [],
  
  // 统一的action修改状态
  eliminatePlayer: (id) => set((state) => ({
    players: state.players.map(p => 
      p.id === id ? { ...p, isAlive: false } : p
    ),
  })),
}));

// ❌ 错误做法：直接修改外部变量
let globalPlayers = [];
function eliminate(id) {
  globalPlayers = globalPlayers.filter(p => p.id !== id);
}
```

### 4️⃣ 异步操作错误

**问题描述**: 未等待异步完成就使用数据

**常见场景**:
- AsyncStorage读取未完成就渲染UI
- Firebase查询未返回就显示空数据

**预防措施**:
```typescript
// ✅ 正确做法：Loading状态
const [isLoading, setIsLoading] = React.useState(true);
const [data, setData] = React.useState(null);

React.useEffect(() => {
  async function loadData() {
    const result = await AsyncStorage.getItem('gameProgress');
    setData(result);
    setIsLoading(false);
  }
  loadData();
}, []);

if (isLoading) {
  return <ActivityIndicator />;  // 显示加载指示器
}

return <View>{/* 渲染数据 */}</View>;
```

### 5️⃣ 内存泄漏

**问题描述**: 组件卸载后仍执行异步操作

**预防措施**:
```typescript
React.useEffect(() => {
  let isMounted = true;

  async function fetchData() {
    const result = await api.getData();
    if (isMounted) {          // 检查组件是否仍然挂载
      setData(result);
    }
  }

  fetchData();

  return () => {
    isMounted = false;        // 清理函数
  };
}, []);
```

### 6️⃣ 平台兼容性问题

**问题描述**: iOS和Android行为不一致

**常见差异**:
- 状态栏高度不同
- 安全区域 insets 不同
- 字体渲染略有差异

**预防措施**:
```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Component = () => {
  const insets = useSafeAreaInsets();  // 动态获取安全区域
  
  return (
    <View style={{ paddingTop: insets.top }}>  {/* 适配刘海屏 */}
      {/* 内容 */}
    </View>
  );
};
```

### 7️⃣ 性能问题

**问题描述**: 列表渲染卡顿

**场景**: 鱼群列表（可能20+条鱼）

**预防措施**:
```typescript
// ✅ 正确做法：使用FlatList虚拟化列表
<FlatList
  data={players}
  renderItem={({ item }) => <PlayerCard player={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}          // 首次渲染数量
  maxToRenderPerBatch={5}         // 每批渲染数量
  windowSize={21}                 // 视口大小
/>

// ❌ 错误做法：使用map渲染大量元素
<View>
  {players.map(p => <PlayerCard key={p.id} player={p} />)}
</View>
```

---

## 🚀 开发路线图

### Phase 1: 单机版基础 (v0.1.0 → v0.5.0)

**目标**: 完整移植网页版所有功能

#### v0.2.0 - 游戏核心逻辑
- [ ] 创建Zustand Store (gameStore.ts)
- [ ] 实现角色数据模型和配置
- [ ] 实现游戏初始化流程（角色分配）
- [ ] 实现白天/夜晚循环
- [ ] 实现问询机制（含所有角色能力）
- [ ] 实现流放投票系统
- [ ] 实现胜负判定逻辑

#### v0.3.0 - UI完善
- [ ] 重构GameScreen为完整游戏界面
- [ ] 添加问询结果弹窗
- [ ] 添加流放投票界面
- [ ] 添加夜晚动画效果
- [ ] 添加游戏结束结算画面
- [ ] 添加鱼群翻牌动画

#### v0.4.0 - 数据持久化
- [ ] 集成AsyncStorage
- [ ] 保存/恢复游戏进度
- [ ] 记录关卡解锁状态
- [ ] 保存用户设置（音效、振动等）
- [ ] 添加清除数据功能

#### v0.5.0 - 单机版完善
- [ ] 添加自由模式（自定义角色配置）
- [ ] 添加游戏规则说明页面
- [ ] 添加设置页面
- [ ] 性能优化和Bug修复
- [ ] 编写单元测试

### Phase 2: 联网版 (v1.0.0 → v1.5.0)

**目标**: 实现多人在线对战

#### v1.0.0 - Firebase集成
- [ ] 创建Firebase项目并配置
- [ ] 集成Firebase Authentication
- [ ] 实现邮箱/Google登录
- [ ] 用户资料设置（头像、昵称）
- [ ] Firestore数据库设计

#### v1.1.0 - 房间系统
- [ ] 创建/加入游戏房间
- [ ] 房间列表展示
- [ ] 房主设置（人数、角色配置）
- [ ] 实时在线状态显示

#### v1.2.0 - 实时对战
- [ ] WebSocket/Realtime DB实时通信
- [ ] 多人游戏状态同步
- [ ] 问询和投票广播
- [ ] 断线重连机制
- [ ] 作弊检测（防止篡改数据）

#### v1.3.0 - 对战优化
- [ ] 观战模式
- [ ] 聊天室功能
- [ ] 回放系统
- [ ] 匹配算法（按段位匹配）

### Phase 3: 社交版 (v2.0.0+)

**目标**: 打造社区生态

#### v2.0.0 - 社交功能
- [ ] 好友系统（添加、删除、黑名单）
- [ ] 私信功能
- [ ] 个人主页
- [ ] 动态发布

#### v2.1.0 - 排行榜与成就
- [ ] 全球排行榜（胜率、场次、积分）
- [ ] 好友排行榜
- [ ] 成就系统（50+成就）
- [ ] 徽章收集

#### v2.2.0 - 分享与互动
- [ ] 一键分享战绩（微信/QQ/朋友圈）
- [ ] 邀请好友功能
- [ ] 分享码/邀请链接
- [ ] 社交媒体集成

#### v2.3.0 - 运营功能
- [ ] Firebase Cloud Messaging推送
- [ ] 每日签到奖励
- [ ] 限时活动
- [ ] 内购系统（去广告、皮肤、表情包）

---

## 📊 关键指标与监控

### 性能指标（目标值）

| 指标 | 目标值 | 测量工具 |
|------|--------|---------|
| **启动时间** | < 2秒 | Expo Metrics |
| **首屏渲染** | < 1秒 | React DevTools |
| **页面切换** | < 300ms | Flipper |
| **内存占用** | < 200MB | Android Studio/Xcode Instruments |
| **APK体积** | < 50MB | Bundle Analyzer |
| **FPS** | ≥ 55 | Flipper Perf Monitor |

### 用户行为追踪（Phase 3实现）

- [ ] Firebase Analytics事件埋点
- [ ] 关卡完成率统计
- [ ] 用户留存分析
- [ ] 漏斗分析（注册→首次游戏→次日留存）

---

## 🔧 开发环境配置

### 必需软件

| 软件 | 版本要求 | 用途 | 下载地址 |
|------|---------|------|---------|
| **Node.js** | >= 18.0.0 | JavaScript运行时 | https://nodejs.org/ |
| **npm** | >= 9.0.0 | 包管理器 | 随Node.js安装 |
| **Git** | >= 2.0 | 版本控制 | https://git-scm.com/ |
| **VS Code** | 最新版 | 代码编辑器 | https://code.visualstudio.com/ |
| **Expo Go** | 最新版 | 手机预览App | App Store / Google Play |

### VS Code推荐扩展

| 扩展名 | 用途 |
|--------|------|
| ESLint | 代码规范检查 |
| Prettier | 代码格式化 |
| TypeScript Importer | 自动导入TypeScript类型 |
| React Native Tools | React Native调试支持 |
| Expo | Expo项目管理 |

### 常用命令速查

```bash
# 开发
npm start                    # 启动Expo开发服务器
npm run android              # 启动Android调试
npm run ios                  # 启动iOS调试（需Mac）
npm run web                  # 启动Web预览

# 构建
npx expo export:web          # 导出Web版本
eas build --platform android # 构建Android APK/IPA
eas build --platform ios     # 构建iOS IPA（需Mac）
eas submit --platform android # 提交到Google Play

# 发布
eas update --branch production --message "新版本" # OTA热更新
npm version major/minor/patch  # 更新版本号

# 依赖管理
npm install <package>        # 安装依赖
npm uninstall <package>      # 卸载依赖
npm update                   # 更新依赖

# Git操作
git status                   # 查看状态
git add .                    # 暂存所有更改
git commit -m "msg"          # 提交
git push                     # 推送到GitHub
git pull                     # 拉取最新代码
```

---

## 📚 学习资源

### 官方文档
- [React Native官方文档](https://reactnative.dev/) - 必读
- [Expo官方文档](https://docs.expo.dev/) - 必读
- [React Navigation文档](https://reactnavigation.org/) - 导航必备
- [React Native Paper文档](https://callstack.github.io/react-native-paper/) - UI组件库
- [Zustand文档](https://github.com/pmndrs/zustand) - 状态管理
- [TypeScript手册](https://www.typescriptlang.org/docs/) - 类型系统

### 推荐教程
- [React Native入门指南](https://reactnative.dev/docs/tutorial) - 官方教程
- [Expo入门工作坊](https://docs.expo.dev/workflow/android-studio-emulator/) - 环境搭建
- [TypeScript深入理解](https://www.typescriptlang.org/docs/handbook/intro.html) - TS进阶

### 视频资源
- B站搜索："React Native 中文教程"
- YouTube: "Expo Crash Course"

### 社区
- [React Native中文社区](https://reactnative.cn/)
- [Expo Discord](https://chat.expo.dev/)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native) - 问题搜索

---

## 🤝 贡献指南

### Bug报告
遇到问题时，请提供：
1. 复现步骤
2. 期望行为 vs 实际行为
3. 截图/录屏
4. 设备信息（OS版本、Expo SDK版本）
5. 相关日志

### 功能建议
提出新功能时，请说明：
1. 功能描述和使用场景
2. 参考实现（如果有）
3. 优先级评估

### Pull Request流程
1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 进行开发和测试
4. 提交代码 (`git commit -m 'feat: add amazing feature'`)
5. 推送分支 (`git push origin feature/amazing-feature`)
6. 创建Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

---

## 👨‍💻 作者与致谢

**作者**: 106-official  
**GitHub**: https://github.com/106-official  
**项目主页**: https://github.com/106-official/SleepTownApp

### 致谢
- [Expo团队](https://expo.dev/) - 提供优秀的开发工具链
- [React Native团队](https://reactnative.dev/) - 强大的跨平台框架
- [Callstack](https://callstack.com/) - React Native Paper组件库
- [SleepTown网页版](https://deepsleep.fun/play/sleeptown/) - 本项目的灵感和数据来源

---

## 📞 联系方式

- **GitHub Issues**: [提交Issue](https://github.com/106-official/SleepTownApp/issues)
- **Email**: (待补充)
- **个人博客**: https://deepsleep.fun

---

## 📝 更新日志

### v0.1.0 (2026-06-23) - 初始版本

#### ✨ 新功能
- ✅ 项目初始化（Expo + React Native + TypeScript）
- ✅ 导航系统配置（3个页面）
- ✅ 首页UI（渐变背景、章节卡片）
- ✅ 关卡选择页面（10个关卡）
- ✅ 游戏界面原型（鱼群展示、操作按钮）
- ✅ 主题系统（亮色/暗色模式）
- ✅ GitHub仓库建立

#### 🛠️ 技术债务
- [ ] GameScreen仅为原型，需实现完整游戏逻辑
- [ ] 关卡数据为硬编码，需改为配置驱动
- [ ] 缺少状态管理（Zustand已安装但未使用）
- [ ] 缺少本地持久化（AsyncStorage已安装但未使用）
- [ ] 缺少单元测试
- [ ] 缺少错误边界处理

#### 📋 下一步计划
参见 [开发路线图](#-开发路线图) 章节

---

> **文档最后更新**: 2026-06-23  
> **文档版本**: v0.1.0  
> **维护者**: 106-official  
> **适用范围**: SleepTown App v0.1.0 及以上版本
