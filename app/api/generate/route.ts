import { configuredModel } from "../../../lib/model-config";
import {
  createAdvisorAgent,
  runDraftHarness,
} from "../../../lib/advisor-agent";
import { NextResponse } from "next/server";
import {
  abstain,
  inputSchema,
  sampleMessages,
  validateMessages,
  VERSION,
} from "../../../lib/studio";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (
    origin &&
    origin !==
      `${new URL(request.url).protocol}//${request.headers.get("host") || new URL(request.url).host}`
  )
    return NextResponse.json({ error: "不允许跨站请求。" }, { status: 403 });
  const text = await request.text();
  if (new TextEncoder().encode(text).length > 40000)
    return NextResponse.json(
      { error: "输入过长，请缩短沟通背景。" },
      { status: 413 },
    );
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: "输入格式无效。" }, { status: 400 });
  }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "请检查输入：称呼、场景和沟通目的必填，且各字段不能超过长度限制。",
      },
      { status: 400 },
    );
  const input = parsed.data;
  const metadata = {
    version: VERSION,
    generatedAt: new Date().toISOString(),
    disposition: input.contactAllowed ? "draft" : "abstain",
  };
  if (!input.contactAllowed)
    return NextResponse.json({
      ...metadata,
      mode: "policy",
      messages: abstain(),
      checks: [],
    });
  if (input.mode === "sample") {
    const messages = sampleMessages(input);
    const checks = validateMessages(messages);
    if (checks.length)
      return NextResponse.json(
        { error: "示例未通过检查，请使用简短、正常的客户称呼。" },
        { status: 422 },
      );
    return NextResponse.json({ ...metadata, mode: "sample", messages, checks });
  }
  // Public deployment never forwards visitor inputs to a paid model.
  if (process.env.NEXT_PUBLIC_DEMO_ONLY === "1")
    return NextResponse.json(
      { error: "公开Demo仅提供固定示例，实时AI请在本地版本运行。" },
      { status: 403 },
    );
  const config = configuredModel();
  if (!config)
    return NextResponse.json(
      {
        error:
          "实时模式尚未配置。请在 .env.local 设置 OPENAI_API_KEY（可选 OPENAI_MODEL），重启服务；也可切换为示例模式。",
      },
      { status: 503 },
    );
  const agent = createAdvisorAgent(config.model);
  const signal = AbortSignal.timeout(45000);
  const result = await runDraftHarness(
    input,
    async (prompt, abortSignal) => {
      const { output, totalUsage } = await agent.generate({
        prompt,
        abortSignal,
      });
      return {
        ...output,
        usage: {
          inputTokens: totalUsage.inputTokens ?? 0,
          outputTokens: totalUsage.outputTokens ?? 0,
          cachedInputTokens: totalUsage.inputTokenDetails?.cacheReadTokens ?? 0,
        },
      };
    },
    signal,
  );
  if (result.ok)
    return NextResponse.json({
      ...metadata,
      generatedAt: new Date().toISOString(),
      mode: "live",
      model: config.modelId,
      provider: config.provider,
      agent: "client-advisor-writer",
      messages: result.messages,
      checks: [],
      attempts: result.trace.length,
      trace: result.trace,
    });
  return NextResponse.json(
    {
      error:
        result.reason === "validation"
          ? "候选文案未通过基础检查。请调整背景后重试。"
          : "模型请求失败、超时或输出解析失败。请检查服务器配置后重试。",
      version: VERSION,
      trace: result.trace,
    },
    { status: result.reason === "validation" ? 422 : 502 },
  );
}
