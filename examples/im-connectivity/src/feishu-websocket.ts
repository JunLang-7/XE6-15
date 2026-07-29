import * as Lark from "@larksuiteoapi/node-sdk";
import { logEvent, requireEnv } from "./env.js";

const baseConfig = {
  appId: requireEnv("FEISHU_APP_ID"),
  appSecret: requireEnv("FEISHU_APP_SECRET"),
};

const apiClient = new Lark.Client(baseConfig);
const wsClient = new Lark.WSClient({
  ...baseConfig,
  loggerLevel: Lark.LoggerLevel.info,
});

const eventDispatcher = new Lark.EventDispatcher({}).register({
  "im.message.receive_v1": async (event) => {
    const message = event.message;
    if (!message?.chat_id || !message.message_id) {
      logEvent("feishu", "message.ignored", { reason: "missing identifiers" });
      return;
    }

    let text = "";
    try {
      text = JSON.parse(message.content ?? "{}").text ?? "";
    } catch {
      text = message.content ?? "";
    }

    logEvent("feishu", "message.received", {
      messageId: message.message_id,
      chatId: message.chat_id,
      messageType: message.message_type,
      text,
    });

    await apiClient.im.v1.message.reply({
      path: { message_id: message.message_id },
      data: {
        msg_type: "text",
        content: JSON.stringify({
          text: `VoiceLife demo 收到：${text || "（非文本消息）"}`,
        }),
      },
    });
    logEvent("feishu", "message.replied", { messageId: message.message_id });
  },
});

wsClient.start({ eventDispatcher });
logEvent("feishu", "websocket.connecting");
