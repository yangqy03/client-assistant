import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/generate/route";
import {
  initialInput,
  reactivationExamples,
  scenarios,
  inputSchema,
  validateMessages,
} from "../lib/studio";
const request = (data: unknown, origin = "http://localhost:3000") =>
  new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json", origin },
    body: JSON.stringify(data),
  });
test("all six sample scenarios return three distinct Chinese messages", async () => {
  for (const scenario of scenarios) {
    const r = await POST(request({ ...initialInput, scenario: scenario.id }));
    assert.equal(r.status, 200);
    const data = await r.json();
    assert.equal(data.mode, "sample");
    assert.equal(data.messages.length, 3);
    assert.deepEqual(validateMessages(data.messages), []);
  }
});
test("no-contact setting bypasses live provider and marks output internal", async () => {
  const r = await POST(
    request({ ...initialInput, mode: "live", contactAllowed: false }),
  );
  const data = await r.json();
  assert.equal(r.status, 200);
  assert.equal(data.disposition, "abstain");
  assert.equal(data.mode, "policy");
  assert.equal(data.messages.length, 3);
});
test("invalid, oversized and cross-origin requests are rejected", async () => {
  assert.equal(
    (await POST(request({ ...initialInput, name: "" }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ ...initialInput, scenario: "invalid" }))).status,
    400,
  );
  assert.equal(
    (await POST(request({ ...initialInput, history: "a".repeat(40001) })))
      .status,
    413,
  );
  assert.equal(
    (await POST(request(initialInput, "https://other.example"))).status,
    403,
  );
  assert.equal(
    (
      await POST(
        new Request("http://localhost:3000/api/generate", {
          method: "POST",
          body: "{",
        }),
      )
    ).status,
    400,
  );
});
test("live mode never silently substitutes samples when unconfigured", async () => {
  const saved = [
    process.env.AI_GATEWAY_API_KEY,
    process.env.AI_MODEL,
    process.env.OPENAI_API_KEY,
    process.env.MODEL_PROVIDER,
  ];
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.AI_MODEL;
  delete process.env.OPENAI_API_KEY;
  process.env.MODEL_PROVIDER = "openai";
  try {
    const r = await POST(request({ ...initialInput, mode: "live" }));
    assert.equal(r.status, 503);
    assert.equal((await r.json()).messages, undefined);
  } finally {
    if (saved[0] !== undefined) process.env.AI_GATEWAY_API_KEY = saved[0];
    if (saved[1] !== undefined) process.env.AI_MODEL = saved[1];
    if (saved[2] !== undefined) process.env.OPENAI_API_KEY = saved[2];
    else delete process.env.OPENAI_API_KEY;
    if (saved[3] !== undefined) process.env.MODEL_PROVIDER = saved[3];
    else delete process.env.MODEL_PROVIDER;
  }
});
test("format and limited claim checks reject representative bad outputs", () => {
  assert.ok(
    validateMessages(["你好", "你好", "保证升值，全网最低，请立即购买"]).length,
  );
  assert.ok(
    validateMessages([
      "请联系 13800138000 了解更多产品信息。",
      "这是一条正常的中文候选文案。",
      "这是一条另外的中文候选文案。",
    ]).length,
  );
  assert.equal(
    inputSchema.safeParse({ ...initialInput, history: "a".repeat(4001) })
      .success,
    false,
  );
});

test("same-origin request accepts loopback host forwarded by Next.js", async () => {
  const req = new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
    body: JSON.stringify(initialInput),
  });
  assert.equal((await POST(req)).status, 200);
});

test("reactivation fixtures ground inquiry and purchase references in exact supplied facts", async () => {
  for (const example of reactivationExamples) {
    const r = await POST(
      request({ ...initialInput, scenario: "reactivation", ...example.data }),
    );
    assert.equal(r.status, 200);
    const result = await r.json();
    assert.deepEqual(result.messages, example.messages(initialInput.name));
    assert.deepEqual(validateMessages(result.messages), []);
    assert.ok(
      result.messages.every(
        (m: string) => !/不必特意回复|无需回复|不必回复/.test(m),
      ),
    );
  }
});
test("edited or missing reactivation facts fall back to generic samples", async () => {
  for (const key of ["client", "history", "product", "context"] as const) {
    const input = {
      ...initialInput,
      scenario: "reactivation",
      ...reactivationExamples[1].data,
      [key]: "未核实或被编辑的信息",
    };
    const r = await POST(request(input));
    const result = await r.json();
    assert.deepEqual(
      result.messages,
      reactivationExamples[2].messages(initialInput.name),
    );
    assert.ok(
      result.messages.every((m: string) => !/折影|上次|之前购买/.test(m)),
    );
  }
});

test("public demo allows samples but blocks direct live requests", async () => {
  const saved = process.env.NEXT_PUBLIC_DEMO_ONLY;
  process.env.NEXT_PUBLIC_DEMO_ONLY = "1";
  try {
    const sample = await POST(request({ ...initialInput, mode: "sample" }));
    assert.equal(sample.status, 200);
    const live = await POST(request({ ...initialInput, mode: "live" }));
    assert.equal(live.status, 403);
    const body = await live.json();
    assert.match(body.error, /公开Demo/);
    assert.equal(body.messages, undefined);
  } finally {
    if (saved === undefined) delete process.env.NEXT_PUBLIC_DEMO_ONLY;
    else process.env.NEXT_PUBLIC_DEMO_ONLY = saved;
  }
});
