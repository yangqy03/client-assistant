import test from "node:test";
import assert from "node:assert/strict";
import { runDraftHarness } from "../lib/advisor-agent";
import { initialInput } from "../lib/studio";
const good = [
  "林女士，您好，您提到的通勤需求可以再和我聊聊。",
  "林女士，您好，挑选手袋时可以先对照日常需要携带的物品。",
  "林女士，您好，如果有需要确认的背法或尺寸，可以告诉我。",
];
test("harness accepts a valid set in one attempt and records it", async () => {
  const result = await runDraftHarness(
    initialInput,
    async () => ({ messages: good }),
    AbortSignal.timeout(1000),
  );
  assert.equal(result.ok, true);
  assert.equal(result.trace.length, 1);
  assert.deepEqual(result.trace[0].messages, good);
});
test("harness repairs once, includes rejected drafts in feedback, and preserves both attempts", async () => {
  let calls = 0;
  const result = await runDraftHarness(
    initialInput,
    async (prompt) => {
      calls++;
      if (calls === 1) return { messages: [good[0], good[0], good[0]] };
      assert.ok(prompt.includes("候选文案重复"));
      assert.ok(prompt.includes(good[0]));
      return { messages: good };
    },
    AbortSignal.timeout(1000),
  );
  assert.equal(result.ok, true);
  assert.equal(calls, 2);
  assert.equal(result.trace[0].status, "rejected");
  assert.equal(result.trace[1].status, "accepted");
});
test("harness rejects persistent invalid text after two attempts", async () => {
  let calls = 0;
  const result = await runDraftHarness(
    initialInput,
    async () => {
      calls++;
      return { messages: ["短", "短", "短"] };
    },
    AbortSignal.timeout(1000),
  );
  assert.equal(result.ok, false);
  assert.equal(calls, 2);
  assert.equal(result.trace.length, 2);
});
test("provider errors do not trigger sample fallback or leak error content", async () => {
  const result = await runDraftHarness(
    initialInput,
    async () => {
      throw new Error("secret-provider-content");
    },
    AbortSignal.timeout(1000),
  );
  assert.equal(result.ok, false);
  assert.equal(result.trace.length, 1);
  assert.ok(!JSON.stringify(result).includes("secret-provider-content"));
});

test("OpenAI configuration never falls back to a gateway credential", async () => {
  const { configuredModel } = await import("../lib/model-config");
  assert.equal(
    configuredModel({
      MODEL_PROVIDER: "openai",
      AI_GATEWAY_API_KEY: "dummy",
      AI_MODEL: "test",
    }),
    null,
  );
  const config = configuredModel({ OPENAI_API_KEY: "not-a-real-key" });
  assert.equal(config?.provider, "openai");
  assert.equal(config?.modelId, "gpt-6.1-sol");
  assert.equal(
    configuredModel({
      MODEL_PROVIDER: "invalid",
      OPENAI_API_KEY: "not-a-real-key",
    }),
    null,
  );
});
