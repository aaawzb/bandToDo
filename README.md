# 极简待办 - 小米手环 Pro 快应用

一款为小米手环 Pro（Vela 平台）设计的极简待办清单快应用。

## 功能

- 待办事项 CRUD（创建、读取、切换完成、删除）
- 优先级系统：无 / 低 / 中 / 高（对应颜色：灰 / 绿 / 黄 / 橙）
- 内置拼音输入法（无需系统键盘）
- 截止日期设置（月历选择器）
- 数据本地持久化（`@system.file`）
- 左滑删除 + 确认弹窗
- 手势震动反馈

## 技术栈

- **平台**: Vela Quick App（小米手环 Pro）
- **框架**: aiot-toolkit
- **屏幕**: 336×480 矩形屏
- **输入法**: NEORUAA/Vela_input_method（拼音输入）

## 项目结构

```
src/
├── App.ux                     # 应用入口
├── manifest.json              # 路由 / 功能声明
├── common/                    # 全局样式 + 图标
├── components/InputMethod/    # 输入法组件（拼音内核）
└── pages/
    ├── index/                 # 主列表页
    ├── input/                 # 输入页（键盘 + 优先级 + 日期）
    └── datepicker/            # 日期选择页
```

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（连接手环）
npm run start

# 构建
npm run build

# 发布
npm run release
```

## 设计参考

- 设计语言：小米 Vela 系统设计规范
- UI 参考：[sf-yuzifu/daymatter](https://github.com/sf-yuzifu/daymatter)
- 输入法组件：[NEORUAA/Vela_input_method](https://github.com/NEORUAA/Vela_input_method)
- 官方示例：`multi_screen_todolist`

## 许可证

MIT
