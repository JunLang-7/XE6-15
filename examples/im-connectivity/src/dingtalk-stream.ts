import {
  DWClient,
  EventAck,
  type RobotMessage,
  TOPIC_ROBOT,
} from "dingtalk-stream";
import { logEvent, requireEnv } from "./env.js";

const client = new DWClient({
  clientId: requireEnv("DINGTALK_CLIENT_ID"),
  clientSecret: requireEnv("DINGTALK_CLIENT_SECRET"),
});

client
  .registerCallbackListener(TOPIC_ROBOT, async (event) => {
    const message = JSON.parse(event.data) as RobotMessage;
    const text = message.text?.content?.trim() ?? "";

    logEvent("dingtalk", "message.received", {
      messageId: event.headers.messageId,
      senderStaffId: message.senderStaffId,
      text,
    });

    // 官方示例通过 sessionWebhook 回复。这里复用 SDK 的 access token，
    // 并在回复成功后确认 Stream 消息，避免平台重复投递。
    const accessToken = await client.getAccessToken();
    const response = await fetch(message.sessionWebhook, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-acs-dingtalk-access-token": accessToken,
      },
      body: JSON.stringify({
        msgtype: "text",
        text: { content: `VoiceLife demo 收到：${text || "（空消息）"}` },
        at: {
          atUserIds: message.senderStaffId ? [message.senderStaffId] : [],
          isAtAll: false,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`钉钉回复失败：HTTP ${response.status}`);
    }

    const result = (await response.json()) as unknown;
    client.socketCallBackResponse(event.headers.messageId, result);
    logEvent("dingtalk", "message.acked", {
      messageId: event.headers.messageId,
    });
  })
  .registerAllEventListener(() => ({ status: EventAck.SUCCESS }))
  .connect();

logEvent("dingtalk", "stream.connecting");
