import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { logEvent, requireEnv } from "./env.js";

export function createWeChatSignature(
  token: string,
  timestamp: string,
  nonce: string,
): string {
  return createHash("sha1")
    .update([token, timestamp, nonce].sort().join(""))
    .digest("hex");
}

export function verifyWeChatSignature(
  token: string,
  signature: string,
  timestamp: string,
  nonce: string,
): boolean {
  return createWeChatSignature(token, timestamp, nonce) === signature;
}

async function readBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    totalBytes += buffer.length;
    if (totalBytes > 1024 * 1024) {
      throw new Error("请求体超过 1 MiB 限制");
    }
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function textResponse(response: ServerResponse, status: number, body: string): void {
  response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  response.end(body);
}

export function createWeChatCallbackServer(token: string) {
  return createServer(async (request, response) => {
    const url = new URL(request.url ?? "/", "http://localhost");
    const signature = url.searchParams.get("signature") ?? "";
    const timestamp = url.searchParams.get("timestamp") ?? "";
    const nonce = url.searchParams.get("nonce") ?? "";

    if (!verifyWeChatSignature(token, signature, timestamp, nonce)) {
      textResponse(response, 403, "invalid signature");
      return;
    }

    if (request.method === "GET") {
      textResponse(response, 200, url.searchParams.get("echostr") ?? "");
      return;
    }

    if (request.method !== "POST") {
      textResponse(response, 405, "method not allowed");
      return;
    }

    try {
      const xml = await readBody(request);
      logEvent("wechat", "callback.received", {
        bytes: Buffer.byteLength(xml),
        encrypted: xml.includes("<Encrypt>"),
      });

      // 本 Demo 只验证明文回调入口。生产建议使用安全模式并接入官方
      // AES 解密实现；先返回空响应快速 ACK，再异步处理业务。
      textResponse(response, 200, "");
    } catch (error) {
      console.error("微信回调读取失败", error);
      textResponse(response, 413, "request rejected");
    }
  });
}

function main(): void {
  const token = requireEnv("WECHAT_TOKEN");
  const port = Number(process.env.WECHAT_PORT ?? "8080");
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("WECHAT_PORT 必须是 1 到 65535 之间的整数");
  }

  createWeChatCallbackServer(token).listen(port, "0.0.0.0", () => {
    logEvent("wechat", "callback.listening", { port, path: "/" });
  });
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], "file:").href) {
  main();
}
