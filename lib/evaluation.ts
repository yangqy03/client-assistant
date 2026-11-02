import { z } from "zod";
import { inputSchema, scenarios } from "./studio";
export const caseSchema = z.object({
  id: z.string().regex(/^TC-\d{3}$/),
  title: z.string().min(1),
  category: z.string().min(1),
  expectedBehavior: z.string().min(1),
  input: inputSchema,
});
export type EvaluationCase = z.infer<typeof caseSchema>;
export type CaseRecord = {
  caseId: string;
  status:
    | "pending"
    | "output_recorded"
    | "policy_abstention"
    | "error"
    | "invalid_response";
  requestedAt?: string;
  elapsedMs?: number;
  httpStatus?: number;
  response?: Record<string, unknown>;
  error?: string;
};
export function validateDataset(value: unknown): EvaluationCase[] {
  const cases = z.array(caseSchema).length(50).parse(value);
  if (new Set(cases.map((c) => c.id)).size !== 50)
    throw new Error("Case IDs must be unique");
  const expected = {
    greeting: 8,
    recommendation: 9,
    care: 8,
    reactivation: 8,
    event: 8,
    price: 9,
  };
  for (const [scenario, count] of Object.entries(expected)) {
    if (cases.filter((c) => c.input.scenario === scenario).length !== count)
      throw new Error(`Incorrect scenario coverage: ${scenario}`);
  }
  if (cases.some((c) => c.input.mode !== "live"))
    throw new Error("Challenge cases must request live mode");
  return cases;
}
const categoryLabels: Record<string, string> = {
  routine: "常规",
  style: "语气",
  boundary: "边界",
  injection: "提示注入",
  language: "语言要求",
  "missing-facts": "信息缺失",
  availability: "库存",
  comparison: "对比",
  "care-risk": "养护风险",
  service: "服务",
  conversation: "对话承接",
  "no-contact": "拒绝联系",
  experience: "体验",
  "approved-policy": "已批准政策",
  alternative: "替代选择",
  "claim-risk": "承诺风险",
};
const cell = (value: string) =>
  value.replace(/\|/g, "\\|").replace(/\r?\n/g, "<br>");
export function renderCaseTable(
  cases: EvaluationCase[],
  records: CaseRecord[] = [],
) {
  const rows = cases.map((c) => {
    const record = records.find((r) => r.caseId === c.id);
    const messages = record?.response?.messages;
    const outputs =
      record &&
      ["output_recorded", "policy_abstention"].includes(record.status) &&
      Array.isArray(messages) &&
      messages.length === 3 &&
      messages.every((m) => typeof m === "string")
        ? (messages as string[])
        : Array(3).fill(
            record?.status === "error"
              ? `运行失败：${record.error || record.response?.error || "未知错误"}`
              : record?.status === "invalid_response"
                ? "响应无效；见原始JSON记录"
                : "待实时生成",
          );
    const client = `${c.input.name}；${c.input.client}\n沟通目的：${c.input.context}\n联系许可：${c.input.contactAllowed ? "允许" : "拒绝（仅内部提示）"}`;
    return [
      c.id,
      scenarios.find((s) => s.id === c.input.scenario)!.name,
      client,
      c.input.history,
      c.input.product,
      ...outputs,
    ]
      .map(cell)
      .join(" | ");
  });
  return `# 50个测试案例\n\n全部输入为虚构。输出只有在真实调用后才填入；“待实时生成”不代表已完成测试。两条拒绝联系案例的预期结果为内部不联系提示，不计作客户触达文案。\n\n| 案例编号 | 场景 | 客户信息 | 会话记录 | 产品信息 | 输出1 | 输出2 | 输出3 |\n|---|---|---|---|---|---|---|---|\n${rows.map((r) => `| ${r} |`).join("\n")}\n\n## 预期行为与测试类型\n\n| 案例编号 | 标题 | 类型 | 预期行为 |\n|---|---|---|---|\n${cases.map((c) => `| ${[c.id, c.title, categoryLabels[c.category] || c.category, c.expectedBehavior].map(cell).join(" | ")} |`).join("\n")}\n`;
}
