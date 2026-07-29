import AiBot, {
  type TemplateCard,
  type TextMessage,
  type WsFrame,
} from "@wecom/aibot-node-sdk";
import { logEvent, requireEnv } from "./env.js";

const ACTION_ACKNOWLEDGE = "acknowledge";
const ACTION_SNOOZE = "snooze_10_minutes";

function createReminderCard(taskId: string, text: string): TemplateCard {
  return {
    card_type: "button_interaction",
    task_id: taskId,
    source: {
      desc: "VoiceLife 声活",
      desc_color: 1,
    },
    main_title: {
      title: "提醒已到",
      desc: text || "这是一个企业微信卡片测试",
    },
    horizontal_content_list: [
      {
        keyname: "时间",
        value: new Date().toLocaleString("zh-CN"),
      },
      {
        keyname: "状态",
        value: "等待处理",
      },
    ],
    button_list: [
      {
        text: "知道了",
        style: 1,
        key: ACTION_ACKNOWLEDGE,
      },
      {
        text: "10 分钟后提醒",
        style: 2,
        key: ACTION_SNOOZE,
      },
    ],
  };
}

function createResultCard(taskId: string, eventKey: string): TemplateCard {
  const snoozed = eventKey === ACTION_SNOOZE;
  return {
    card_type: "text_notice",
    task_id: taskId,
    source: {
      desc: "VoiceLife 声活",
      desc_color: 3,
    },
    main_title: {
      title: snoozed ? "已推迟提醒" : "已确认提醒",
      desc: snoozed ? "将在 10 分钟后再次提醒" : "本次提醒已处理",
    },
    horizontal_content_list: [
      {
        keyname: "状态",
        value: "操作成功",
      },
    ],
  };
}

function createTaskId(messageId: string): string {
  const safeMessageId = messageId.replace(/[^0-9A-Za-z_@-]/g, "_");
  return `voicelife_${safeMessageId}`.slice(0, 128);
}

const client = new AiBot.WSClient({
  botId: requireEnv("WECOM_BOT_ID"),
  secret: requireEnv("WECOM_BOT_SECRET"),
  maxReconnectAttempts: -1,
});

client.on("authenticated", () => {
  logEvent("wecom", "websocket.authenticated");
});

client.on("message.text", (frame: WsFrame<TextMessage>) => {
  if (!frame.body) {
    logEvent("wecom", "message.ignored", { reason: "missing body" });
    return;
  }

  const text = frame.body.text?.content?.trim() ?? "";
  const taskId = createTaskId(frame.body.msgid);

  logEvent("wecom", "message.received", {
    requestId: frame.headers.req_id,
    messageId: frame.body.msgid,
    userId: frame.body.from?.userid,
    text,
  });

  void client
    .replyTemplateCard(frame, createReminderCard(taskId, text))
    .then(() => {
      logEvent("wecom", "card.replied", {
        requestId: frame.headers.req_id,
        taskId,
      });
    })
    .catch((error: unknown) => {
      console.error("企业微信卡片回复失败", error);
    });
});

client.on("event.template_card_event", (frame) => {
  if (!frame.body) {
    logEvent("wecom", "card.event.ignored", { reason: "missing body" });
    return;
  }

  const { event_key: eventKey, task_id: taskId } = frame.body.event;
  if (!eventKey || !taskId) {
    logEvent("wecom", "card.event.ignored", {
      reason: "missing event key or task id",
      messageId: frame.body.msgid,
    });
    return;
  }

  if (eventKey !== ACTION_ACKNOWLEDGE && eventKey !== ACTION_SNOOZE) {
    logEvent("wecom", "card.event.ignored", {
      reason: "unknown event key",
      eventKey,
      taskId,
    });
    return;
  }

  logEvent("wecom", "card.event.received", {
    messageId: frame.body.msgid,
    taskId,
    eventKey,
    userId: frame.body.from.userid,
  });

  // 企业微信要求在模板卡片事件回调后 5 秒内完成更新。
  void client
    .updateTemplateCard(frame, createResultCard(taskId, eventKey))
    .then(() => {
      logEvent("wecom", "card.updated", { taskId, eventKey });
    })
    .catch((error: unknown) => {
      console.error("企业微信卡片更新失败", error);
    });
});

client.on("error", (error) => {
  console.error("企业微信 WebSocket 错误", error);
});

client.connect();
logEvent("wecom", "websocket.connecting");

process.once("SIGINT", () => {
  client.disconnect();
  process.exit(0);
});
