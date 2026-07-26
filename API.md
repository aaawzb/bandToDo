# 手机端同步接口对接文档

> 版本：1.0  
> 适用平台：小米手环 Pro（Vela 快应用）  
> 本文档面向手机端（Android/iOS）开发者，描述如何与手环端待办应用进行数据同步。

---

## 目录

1. [概述](#1-概述)
2. [连接建立](#2-连接建立)
3. [消息格式](#3-消息格式)
4. [API 接口详解](#4-api-接口详解)
5. [数据模型](#5-数据模型)
6. [错误处理](#6-错误处理)
7. [示例代码](#7-示例代码)
8. [注意事项](#8-注意事项)

---

## 1. 概述

### 协议简介

手环端与手机端通过 Vela 平台的 `@system.interconnect` 模块进行双向通信。协议基于 JSON 消息，采用请求-响应 + 主动推送的混合模式。

- **手机→手环**：手机主动发送增删改查指令
- **手环→手机**：手环响应查询请求，或在数据变更后主动推送通知

### 通信方式

| 项目 | 说明 |
|------|------|
| 传输层 | `@system.interconnect`（Vela 系统互联 API） |
| 数据格式 | UTF-8 编码的 JSON 字符串 |
| 消息方向 | 双向，全双工 |
| 连接生命周期 | 手环应用启动时建立，应用退出时断开 |

### 通信流程

```
手机端                              手环端
  │                                   │
  │── getAllTodo ───────────────────> │  请求所有待办
  │                                   │
  │<── syncResponse (todos[]) ─────── │  返回全部数据
  │                                   │
  │── addTodo (todo) ───────────────> │  添加待办
  │                                   │
  │<── todoChanged ────────────────── │  推送变更通知
  │                                   │
  │── getAllTodo ───────────────────> │  手机重新拉取
  │                                   │
  │<── syncResponse (todos[]) ─────── │  返回最新数据
```

---

## 2. 连接建立

### 前提条件

1. 手机端已通过 Vela 互联 SDK 与手环建立连接
2. 手环端已安装并启动待办快应用
3. 双方使用相同的 interconnect 通道标识

### 初始化步骤

手机端在调用任何同步 API 之前，需要完成以下初始化：

1. 获取 interconnect 实例
2. 注册消息监听器（onmessage）
3. 监听连接状态（onopen / onclose）
4. 确认连接就绪后开始通信

### 连接状态管理

- 连接断开时，手机端应停止发送消息并进入重连等待
- 手环应用重启后连接会断开，手机端需重新建立连接
- 建议在发送消息前检查连接状态，避免消息丢失

---

## 3. 消息格式

### 通用消息结构

所有消息均为 JSON 对象，必须包含 `type` 字段标识消息类型：

```json
{
  "type": "消息类型标识",
  ...其他业务字段
}
```

### 消息类型总览

| type 值 | 方向 | 说明 |
|---------|------|------|
| `getAllTodo` | 手机→手环 | 请求获取所有待办 |
| `addTodo` | 手机→手环 | 请求添加待办 |
| `updateTodo` | 手机→手环 | 请求更新待办 |
| `deleteTodo` | 手机→手环 | 请求删除待办 |
| `syncResponse` | 手环→手机 | 返回所有待办数据 |
| `todoChanged` | 手环→手机 | 通知数据已变更 |

### 传输编码

发送前需要将 JSON 对象序列化为字符串：

```
发送：JSON.stringify(payload)
接收：JSON.parse(message.data)
```

---

## 4. API 接口详解

### 4.1 获取所有待办（getAllTodo）

手机端发送此消息，请求手环返回当前所有待办数据。

**请求消息：**

```json
{
  "type": "getAllTodo"
}
```

**响应消息（syncResponse）：**

```json
{
  "type": "syncResponse",
  "todos": [
    {
      "title": "完成周报",
      "done": false,
      "priority": "高",
      "dueDate": "2026-07-30",
      "themeColor": "#3184d0",
      "createdAt": "2026-07-26T10:30:00.000Z"
    },
    {
      "title": "买菜",
      "done": true,
      "priority": "中",
      "dueDate": "",
      "themeColor": "#3184d0",
      "createdAt": "2026-07-25T08:15:00.000Z"
    }
  ]
}
```

**说明：**

- 请求消息无额外字段
- 响应中 `todos` 为数组，若无待办则为空数组 `[]`
- 此接口为一次性响应，不会主动重复返回
- 仅在收到 `getAllTodo` 请求后触发

---

### 4.2 添加待办（addTodo）

手机端发送此消息，请求手环添加一条新待办。

**请求消息：**

```json
{
  "type": "addTodo",
  "todo": {
    "title": "预约体检",
    "done": false,
    "priority": "中",
    "dueDate": "2026-08-15",
    "themeColor": "#3184d0",
    "createdAt": "2026-07-26T14:20:00.000Z"
  }
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `todo` | object | 是 | 待办对象 |
| `todo.title` | string | 是 | 待办标题，不能为空 |
| `todo.done` | boolean | 是 | 完成状态，新添加的待办通常为 `false` |
| `todo.priority` | string | 是 | 优先级：`'无'` / `'低'` / `'中'` / `'高'` |
| `todo.dueDate` | string | 否 | 截止日期，格式 `YYYY-MM-DD`，无截止日期传 `""` |
| `todo.themeColor` | string | 否 | 主题色 hex 值，默认 `#3184d0` |
| `todo.createdAt` | string | 是 | ISO 8601 时间戳，作为唯一标识，手机端生成 |

**响应：**

添加成功后，手环端会向所有连接的客户端广播 `todoChanged` 通知（见 4.5 节）。

**重要提示：**

- `createdAt` 由手机端生成，全局唯一，建议使用当前 UTC 时间戳
- 手环端会校验 `title` 和 `createdAt` 是否存在，缺失则忽略该请求
- 添加成功后手环端会主动推送 `todoChanged`，手机端收到后应重新调用 `getAllTodo` 获取最新数据

---

### 4.3 更新待办（updateTodo）

手机端发送此消息，请求手环更新一条已有待办。

**请求消息：**

```json
{
  "type": "updateTodo",
  "todo": {
    "title": "完成周报（已修改）",
    "done": true,
    "priority": "高",
    "dueDate": "2026-07-29",
    "themeColor": "#ff6a24",
    "createdAt": "2026-07-26T10:30:00.000Z"
  }
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `todo` | object | 是 | 完整的待办对象（非增量更新） |
| `todo.title` | string | 是 | 更新后的标题 |
| `todo.done` | boolean | 是 | 更新后的完成状态 |
| `todo.priority` | string | 是 | 更新后的优先级 |
| `todo.dueDate` | string | 否 | 更新后的截止日期 |
| `todo.themeColor` | string | 否 | 更新后的主题色 |
| `todo.createdAt` | string | 是 | **不可修改**，用于定位目标待办 |

**匹配逻辑：**

手环端通过 `createdAt` 字段查找目标待办，找到后整体替换。

**响应：**

更新成功后，手环端会广播 `todoChanged` 通知。

**重要提示：**

- 这是**全量替换**，不是增量更新。即使只改了 `done` 状态，也需要传完整的 todo 对象
- `createdAt` 是匹配键，不能修改，否则找不到目标
- 如果 `createdAt` 不存在于手环数据中，该请求会被静默忽略

---

### 4.4 删除待办（deleteTodo）

手机端发送此消息，请求手环删除一条待办。

**请求消息：**

```json
{
  "type": "deleteTodo",
  "createdAt": "2026-07-26T10:30:00.000Z"
}
```

**字段说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `createdAt` | string | 是 | 待删除待办的唯一标识 |

**响应：**

删除成功后，手环端会广播 `todoChanged` 通知。

**重要提示：**

- 只需传 `createdAt`，无需传完整 todo 对象
- 如果 `createdAt` 不存在，该请求会被静默忽略
- 删除操作不可逆，手机端应在用户确认后再发送此消息

---

### 4.5 数据变更通知（todoChanged）

手环端在数据发生变更（添加、更新、删除）后，主动向手机端推送此通知。

**通知消息：**

```json
{
  "type": "todoChanged"
}
```

**说明：**

- 此消息为单向通知，无响应
- 消息体仅包含 `type` 字段，不含具体变更内容
- 手机端收到此消息后，应立即发送 `getAllTodo` 重新拉取最新数据
- 手环端任何数据变更（包括手环本地用户操作、其他手机端操作）都会触发此推送

**典型处理流程：**

```
收到 todoChanged
    │
    ▼
发送 getAllTodo
    │
    ▼
收到 syncResponse
    │
    ▼
更新本地 UI 和数据缓存
```

---

## 5. 数据模型

### Todo 对象

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `title` | string | 是 | - | 待办标题，最大长度建议不超过 50 字符 |
| `done` | boolean | 是 | `false` | 完成状态：`true` 已完成，`false` 未完成 |
| `priority` | string | 是 | `'无'` | 优先级，枚举值：`'无'` / `'低'` / `'中'` / `'高'` |
| `dueDate` | string | 否 | `''` | 截止日期，格式 `YYYY-MM-DD`，无截止日期为空字符串 |
| `themeColor` | string | 否 | `'#3184d0'` | 主题色，hex 格式 |
| `createdAt` | string | 是 | - | ISO 8601 时间戳，**全局唯一标识，创建后不可修改** |

### 优先级颜色对照

| 优先级 | 显示颜色 | Hex 值 |
|--------|----------|--------|
| 无 | 灰色 | `#6f6f6f` |
| 低 | 绿色 | `#4cd964` |
| 中 | 黄色 | `#ffc043` |
| 高 | 橙色 | `#ff6a24` |

### 完整 Todo 示例

```json
{
  "title": "完成项目文档",
  "done": false,
  "priority": "高",
  "dueDate": "2026-08-01",
  "themeColor": "#3184d0",
  "createdAt": "2026-07-26T10:30:00.000Z"
}
```

---

## 6. 错误处理

### 错误场景

| 场景 | 表现 | 处理建议 |
|------|------|----------|
| 连接断开 | 消息发送失败 | 监听 onclose 事件，进入重连逻辑 |
| 手环应用未启动 | 连接无法建立 | 提示用户打开手环端应用 |
| 消息格式错误 | 手环端 JSON 解析失败 | 确保发送的是合法 JSON 字符串 |
| 必填字段缺失 | 手环端静默忽略请求 | 发送前校验所有必填字段 |
| createdAt 重复 | 添加时产生重复数据 | 确保 createdAt 全局唯一 |
| 手环存储读取失败 | 返回空数组或操作失败 | 手机端收到空数据时不应覆盖本地缓存 |

### 超时建议

- 发送 `getAllTodo` 后，建议设置 5 秒超时
- 超时未收到 `syncResponse`，可重试一次，仍失败则提示用户检查连接
- 写操作（add/update/delete）后，等待 `todoChanged` 通知，超时时间建议 3 秒

### 重连策略

1. 检测到连接断开后，等待 2 秒再尝试重连
2. 重连成功后，立即发送 `getAllTodo` 同步最新数据
3. 连续 3 次重连失败后，提示用户手动检查

---

## 7. 示例代码

### Android 伪代码

```java
// 初始化连接
InterconnectClient client = Interconnect.getClient();
client.connect("todoapp_channel");

// 消息监听
client.setOnMessageListener(message -> {
    JSONObject data = new JSONObject(message.getData());
    String type = data.getString("type");
    
    switch (type) {
        case "syncResponse":
            JSONArray todos = data.getJSONArray("todos");
            handleSyncResponse(todos);
            break;
        case "todoChanged":
            // 数据变更，重新拉取
            getAllTodos();
            break;
    }
});

// 连接状态监听
client.setOnOpenListener(() -> {
    connected = true;
    // 连接成功后立即同步数据
    getAllTodos();
});

client.setOnCloseListener(() -> {
    connected = false;
    // 触发重连逻辑
    scheduleReconnect();
});

// 获取所有待办
void getAllTodos() {
    if (!connected) return;
    JSONObject msg = new JSONObject();
    msg.put("type", "getAllTodo");
    client.send(msg.toString());
}

// 添加待办
void addTodo(String title, String priority, String dueDate) {
    if (!connected) return;
    JSONObject msg = new JSONObject();
    msg.put("type", "addTodo");
    
    JSONObject todo = new JSONObject();
    todo.put("title", title);
    todo.put("done", false);
    todo.put("priority", priority);
    todo.put("dueDate", dueDate != null ? dueDate : "");
    todo.put("themeColor", "#3184d0");
    todo.put("createdAt", ISO8601.now());
    
    msg.put("todo", todo);
    client.send(msg.toString());
}

// 更新待办
void updateTodo(JSONObject existingTodo) {
    if (!connected) return;
    JSONObject msg = new JSONObject();
    msg.put("type", "updateTodo");
    msg.put("todo", existingTodo);
    client.send(msg.toString());
}

// 删除待办
void deleteTodo(String createdAt) {
    if (!connected) return;
    JSONObject msg = new JSONObject();
    msg.put("type", "deleteTodo");
    msg.put("createdAt", createdAt);
    client.send(msg.toString());
}
```

### iOS 伪代码

```swift
import VelaInterconnect

class TodoSyncManager: NSObject {
    var client: InterconnectClient?
    var connected = false
    
    func initSync() {
        client = InterconnectClient(channel: "todoapp_channel")
        
        client?.onMessage = { [weak self] message in
            guard let data = message.data.data(using: .utf8),
                  let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let type = json["type"] as? String else { return }
            
            switch type {
            case "syncResponse":
                if let todos = json["todos"] as? [[String: Any]] {
                    self?.handleSyncResponse(todos)
                }
            case "todoChanged":
                self?.getAllTodos()
            default:
                break
            }
        }
        
        client?.onOpen = { [weak self] in
            self?.connected = true
            self?.getAllTodos()
        }
        
        client?.onClose = { [weak self] in
            self?.connected = false
            self?.scheduleReconnect()
        }
        
        client?.connect()
    }
    
    func getAllTodos() {
        guard connected else { return }
        let msg = ["type": "getAllTodo"]
        send(msg)
    }
    
    func addTodo(title: String, priority: String, dueDate: String?) {
        guard connected else { return }
        let todo: [String: Any] = [
            "title": title,
            "done": false,
            "priority": priority,
            "dueDate": dueDate ?? "",
            "themeColor": "#3184d0",
            "createdAt": ISO8601DateFormatter().string(from: Date())
        ]
        let msg: [String: Any] = ["type": "addTodo", "todo": todo]
        send(msg)
    }
    
    func updateTodo(_ todo: [String: Any]) {
        guard connected else { return }
        let msg: [String: Any] = ["type": "updateTodo", "todo": todo]
        send(msg)
    }
    
    func deleteTodo(createdAt: String) {
        guard connected else { return }
        let msg: [String: Any] = ["type": "deleteTodo", "createdAt": createdAt]
        send(msg)
    }
    
    private func send(_ msg: [String: Any]) {
        guard let data = try? JSONSerialization.data(withJSONObject: msg),
              let json = String(data: data, encoding: .utf8) else { return }
        client?.send(json)
    }
}
```

---

## 8. 注意事项

### Vela 平台限制

| 限制项 | 说明 |
|--------|------|
| 消息大小 | 单条消息建议不超过 10KB，避免传输失败 |
| 连接数 | 同时连接的客户端数量有限，建议手机端断开后及时释放 |
| 后台运行 | 手环应用退到后台后 interconnect 可能断开，需处理重连 |
| 存储限制 | 手环端存储空间有限，待办数量建议控制在 200 条以内 |

### 性能考虑

- **批量操作**：如需添加多条待办，逐条发送 addTodo 即可，每次操作后手环端会推送 todoChanged，无需手动节流
- **数据缓存**：手机端应维护本地缓存，收到 syncResponse 后全量替换，而非增量合并
- **避免轮询**：不要定时轮询数据，依赖 todoChanged 推送驱动更新

### 安全建议

- **数据校验**：手机端收到 syncResponse 后，应校验 todo 对象的字段合法性
- **敏感数据**：待办内容明文传输，不建议存储敏感信息（如密码、身份信息等）
- **连接认证**：依赖 Vela 平台底层的设备认证机制，应用层无需额外加密

### 其他

- `createdAt` 是唯一标识，一旦创建不可修改。更新操作通过 createdAt 匹配目标，替换整个对象
- `syncResponse` 只在收到 `getAllTodo` 后触发，不会主动推送
- `todoChanged` 是手环端主动推送，手机端收到后应重新请求数据
- 手环端数据存储在 `internal://app/data/todos.json`，手机端无需关心存储细节
- 时间格式统一使用 ISO 8601（如 `2026-07-26T10:30:00.000Z`），建议使用 UTC 时间
