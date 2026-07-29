# IM 无公网 IP 最小连接 Demo

这些 Demo 用于验证“仅能主动访问公网、没有公网入站 IP 的硬件”如何接入钉钉、飞书、企业微信和微信。它们是协议连通性 PoC，不包含 VoiceLife 业务逻辑、生产持久化或完整安全加固。

## 环境

- Node.js 20+
- 平台管理员创建的测试应用或测试号
- 硬件能访问相应平台的 HTTPS/WSS 服务

```bash
cd examples/im-connectivity
npm install
npm run check
```

复制 `.env.example` 中所需变量到当前 shell。该示例不自动读取 `.env`，避免误把本地凭据文件作为运行前提：

```bash
export FEISHU_APP_ID=cli_xxx
export FEISHU_APP_SECRET=xxx
npm run feishu
```

## Demo 一览

| 命令 | 平台模式 | 入站方向 | 设备需公网 IP |
| --- | --- | --- | --- |
| `npm run dingtalk` | 钉钉 Stream 机器人 | 设备主动建立 Stream 长连接 | 否 |
| `npm run feishu` | 飞书企业自建应用长连接 | 设备主动建立 WebSocket | 否 |
| `npm run wecom` | 企业微信智能机器人长连接 | 设备主动建立 WebSocket | 否 |
| `npm run wechat` | 微信服务号服务器回调 | 微信服务器访问回调 URL | 回调入口需公网可达；设备本身可通过 Relay 保持私网 |

### 钉钉

1. 创建企业内部应用并获取 ClientID（AppKey）与 ClientSecret（AppSecret）。
2. 添加机器人能力，接收消息模式选 Stream，发布应用。
3. 配置 `DINGTALK_CLIENT_ID`、`DINGTALK_CLIENT_SECRET` 后运行 `npm run dingtalk`。
4. 给机器人发送文本，观察 `message.received`、回复和 `message.acked`。

SDK 当前 npm 最新版本是 beta，因此生产前必须锁版本，并测试断网、恢复、重复消息和 60 秒内未 ACK 的重推行为。

### 飞书

1. 创建企业自建应用，添加机器人能力和 `im.message.receive_v1` 事件。
2. 授予接收消息和以机器人身份回复消息的权限，发布可用版本。
3. 事件订阅选择“使用长连接接收事件”。
4. 配置 `FEISHU_APP_ID`、`FEISHU_APP_SECRET` 后运行 `npm run feishu`。

本 Demo 使用官方 `@larksuiteoapi/node-sdk` 的 `WSClient`，因为其稳定 API 和类型可直接编译验证。飞书正在将新的 Channel 能力迁往独立 Channel SDK；正式实现前要再验证迁移文档和目标版本，不应无条件长期依赖旧 Channel 入口。

### 企业微信

1. 创建智能机器人并启用 API 长连接模式。
2. 获取 BotID 和长连接专用 Secret。
3. 配置 `WECOM_BOT_ID`、`WECOM_BOT_SECRET` 后运行 `npm run wecom`。
4. 发文本消息，机器人会返回带“知道了”和“10 分钟后提醒”按钮的模板卡片；点击按钮后，Demo 会在 5 秒窗口内把原卡片更新为操作结果。

官方 SDK 自动心跳并指数退避重连；Demo 将最大重连次数设为无限，仅用于设备 PoC。生产环境仍需外部进程守护、连接状态监控和告警。同一机器人同一时刻只能有一个有效长连接，不要用多实例主动连接实现广播。Demo 的按钮事件目前只更新展示，没有实际关闭或推迟业务提醒；接入业务服务时还必须先持久化回调、按 `msgid/task_id/event_key` 去重并校验点击用户。

### 微信服务号

1. 配置 `WECHAT_TOKEN`，运行 `npm run wechat`。
2. 本地先执行 `npm run test:wechat` 验证 SHA-1 URL 签名逻辑。
3. 微信后台需要填写一个平台可访问的 HTTP(S) URL。硬件无公网 IP 时，应由云 Relay 或临时反向隧道转发到本 Demo。
4. Demo 支持 GET URL 验证，以及 POST XML 的快速空响应 ACK。

该实现**只验证明文入口，不是生产回调实现**。生产应启用安全模式，使用经过验证的官方/可信 AES 加解密库，限制请求体、记录去重键、先持久化再 ACK，并异步处理耗时业务。正式 URL 还必须遵循微信后台当前的协议和端口要求。

## 必测故障场景

平台凭据和测试账号齐备后，逐项记录：

1. 首次连接/URL 校验是否成功，所需权限是否完整；
2. 文本、图片、语音、卡片事件的真实字段；
3. 正常回复、超时、重复投递及稳定去重键；
4. 断网 1 分钟、10 分钟、设备重启后的恢复行为；
5. 多实例连接限制、代理环境、DNS/TLS 失败；
6. 设备离线期间平台是否补发、补发窗口和消息顺序；
7. 端到端延迟、速率限制和凭据轮换。

没有完成这些真实租户测试前，只能称为“代码可编译、协议路径已确认”，不能称为平台端闭环通过。
