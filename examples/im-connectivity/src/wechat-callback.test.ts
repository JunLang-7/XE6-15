import assert from "node:assert/strict";
import { createWeChatSignature, verifyWeChatSignature } from "./wechat-callback.js";

const token = "voicelife-test-token";
const timestamp = "1785216000";
const nonce = "hardware-no-public-ip";
const expected = createWeChatSignature(token, timestamp, nonce);

assert.match(expected, /^[a-f0-9]{40}$/);
assert.equal(verifyWeChatSignature(token, expected, timestamp, nonce), true);
assert.equal(verifyWeChatSignature(token, "0".repeat(40), timestamp, nonce), false);
assert.equal(
  createWeChatSignature(token, timestamp, nonce),
  createWeChatSignature(nonce, token, timestamp),
  "签名输入应先按字典序排序",
);

console.log("微信 URL 验签自测通过");
