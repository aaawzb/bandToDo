# 极简待办 - 小米手环 Pro 快应用

一款为小米手环 Pro（Vela 平台）设计的极简待办清单快应用。支持矩形屏、圆形屏和胶囊屏三种形态。

> 版本：v0.2.0（重大重构）

## 功能

- **待办 CRUD**：创建、切换完成、长按删除（带确认弹窗）
- **主题色系统**：5 种主题色可选（蓝 / 橙 / 红 / 绿 / 紫），每个待办可独立设置
- **优先级系统**：无 / 低 / 中 / 高（灰 / 绿 / 黄 / 橙）
- **内置拼音输入法**：无需系统键盘，支持全键盘（QWERTY）和九键（T9）
- **截止日期设置**：月历选择器，支持年/月/日滚动
- **手机管理**：通过 `@system.interconnect` 实现手机与手环数据同步
- **数据本地持久化**：`@system.file` 读写 `internal://app/data/todos.json`
- **手势交互**：点击切换完成、长按删除、震动反馈
- **多屏适配**：band 矩形屏 / watch 矩形屏 / watch 圆形屏 / 胶囊屏
- **白色卡片 UI**：daymatter 风格白色卡片设计
- **Swiper 轮播**：多个待办时左右滑动切换

## 技术栈

| 项目 | 说明 |
|------|------|
| 平台 | Vela Quick App（小米手环 Pro） |
| 框架 | aiot-toolkit ^2.0.5 |
| 语言 | JavaScript + UX 模板 |
| 屏幕 | 336×480（矩形）/ 480×480（圆形） |
| 输入法 | NEORUAA/Vela_input_method（拼音内核） |

## 项目结构

```
src/
├── app.ux                      # 应用入口（全局状态初始化，无模板）
├── manifest.json               # 路由 / 权限 / 设备配置
├── common/
│   ├── app.css                 # 共享基础样式（根布局 + @media 适配）
│   ├── utils.js                # 工具函数（优先级颜色 + 主题色 + DATA_PATH）
│   ├── sync.js                 # @system.interconnect 同步协议层
│   └── *.png                   # 图标资源
├── components/
│   └── InputMethod/            # 输入法组件（拼音内核，只读）
│       ├── InputMethod.ux      # 组件主文件
│       ├── assets/dicUtil.js   # 拼音字典引擎
│       ├── assets/dic.js       # 中文字典
│       ├── assets/dic_jp.js    # 日文字典
│       └── assets/             # 键盘图片资源
└── pages/
    ├── index/                  # 主列表页（白色卡片 + Swiper + 主题色边框）
    ├── input/                  # 输入页（胶囊输入框 + 主题色选择器 + 优先级）
    └── datepicker/             # 日期选择页（白色卡片容器）
```

## 数据模型

```javascript
{
  title: string,        // 待办标题
  done: boolean,        // 完成状态
  priority: string,     // '无' | '低' | '中' | '高'
  dueDate: string,      // 'YYYY-MM-DD' 或 ''
  themeColor: string,   // 主题色 hex，默认 '#3184d0'
  createdAt: string     // ISO 时间戳，唯一标识
}
```

## 构建指南

> **重要**：构建只能通过 GitHub Actions CI 进行。本地工具链已损坏（`node_modules/@aiot-toolkit/aiotpack/lib/index.js` 缺失），`npm run build` 会失败。

推送到 `main` 分支触发 `.github/workflows/build.yml`，构建产物在 Actions Artifacts 中：

- `rpk`：签名后的 RPK 包
- `build`：构建输出目录

本地可用的命令：

```bash
# Lint 检查（eslint，规则：semi: never、quotes: single、no-unused-vars: warn）
npm run lint
```

## 架构约定

### 全局状态

全局状态走 `global.*`，在 `src/app.ux` 的 `onCreate` 中通过 `device.getInfo()` 初始化：

- `screenShape`：rect / circle / pill-shaped
- `deviceType`：watch / band
- `screenWidth` / `screenHeight` / `screenSize`
- `isPillShaped`
- `getTime()`：返回 `HH:MM` 格式时间

页面使用 `global.xxx ? global.xxx : 兜底` 防御未初始化。

### 页面间传值

input 页跳转 datepicker 前不设值；datepicker 的 `saveDate()` 写入 `global.returnedDate`（格式 `YYYY-MM-DD`）然后 `router.back()`；input 页在 `onShow` 读取后立即清空 `global.returnedDate = ''`。

### 路由

在 `src/manifest.json` 中声明：

- `pages/index`（入口）
- `pages/input`
- `pages/datepicker`

`deviceTypeList: ["watch", "band"]`

### 数据持久化

使用 `@system.file` 读写 `internal://app/data/todos.json`（JSON 数组）。读用 `file.readText`，写用 `file.writeText`。

### 样式

- `src/common/app.css` 是共享基础样式（`.time` / `.top` / `.bottom` / `.title` 绝对定位 + `@media` 按 `device-type` × `shape` 调间距）
- 各页 `@import` 它，不重复定义根布局
- 颜色/优先级工具函数：`src/common/utils.js` 导出 `getPriorityColor(p)`

### 图标命名

- 矩形屏：`add.png` / `back.png` / `check.png` / `del.png`
- 圆形屏：`add_rect.png` / `back_rect.png` / `check_rect.png` / `del_rect.png`
- 注意：命名是矩形用无后缀，圆形用 `*_rect`（与直觉相反）

## Vela 编译约束

违反以下规则即构建失败：

| 约束 | 说明 |
|------|------|
| 模板根元素 | `<template>` 必须只有 **1 个根元素**，`<import>` 和自定义组件放在根 `<div>` 内部 |
| 不支持的 CSS | `::placeholder`、`:empty`、`:last-child`、`:first-child`、`:active`、`:hover` 等会报 `Selector type unsupport` |
| `lines` 属性 | `<text lines="1">` 和 CSS `lines: 1` 不支持，改用 `height` + `text-overflow: ellipsis` |
| border-radius | 不支持百分比值 |
| 事件绑定 | 组件事件用 kebab-case（`@complete` / `@delete` / `@keydown` / `@visibilitychange`） |
| 插值绑定 | 不支持在事件绑定中使用 `{{ }}` 插值（如 `onclick="fun({{ $idx }})"`） |
| `<text>` 嵌套 | `<text>` 不支持嵌套子元素（`<img>`、`<span>` 等），需用 `<div>` 包裹 |

## 手机端对接

通过 `@system.interconnect` 实现手机与手环数据同步。详细的通信协议和对接方式见 [API.md](./API.md)。

## CI/CD

- 分支：`main`
- 工作流：`.github/workflows/build.yml`
- 步骤：checkout → setup node 18 → install → build → verify output → sign → upload artifacts
- 签名：使用 Secrets `CERT_PEM` / `KEY_PEM`，缺密钥时跳过签名（仍上传未签名 rpk）
- 签名私钥不得入库，`sign/` 已在 `.gitignore`

## 参考

- UI 参考：[sf-yuzifu/daymatter](https://github.com/sf-yuzifu/daymatter)
- 输入法组件：[NEORUAA/Vela_input_method](https://github.com/NEORUAA/Vela_input_method)
- 官方文档：[open-vela/docs](https://github.com/open-vela/docs)

## 许可证

MIT
