import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { validateMessages, scenarios } from "../lib/studio";
const file = process.env.REPORT_RUN_RESULTS;
if (!file) throw new Error("Set REPORT_RUN_RESULTS to the run results.json");
const run = JSON.parse(await readFile(file, "utf8"));
const records = run.records as Array<any>;
const recorded = records.filter((r) => r.status === "output_recorded");
const policy = records.filter((r) => r.status === "policy_abstention");
const drafts = recorded.flatMap((r) => r.response.messages as string[]);
const traces = records.flatMap((r) => r.response?.trace || []);
const usages = traces.filter((t) => t.usage).map((t) => t.usage);
const inputTokens = usages.reduce((s, u) => s + u.inputTokens, 0);
const outputTokens = usages.reduce((s, u) => s + u.outputTokens, 0);
const cachedInputTokens = usages.reduce(
  (s, u) => s + (u.cachedInputTokens || 0),
  0,
);
const latencies = recorded
  .map((r) => r.elapsedMs as number)
  .sort((a, b) => a - b);
const percentile = (p: number) =>
  latencies.length
    ? latencies[Math.max(0, Math.ceil(latencies.length * p) - 1)]
    : null;
const summary = {
  runId: run.runId,
  appVersion: run.appVersion,
  model: run.expectedModel,
  totalInputs: run.inputSnapshot.length,
  recordedCases: recorded.length,
  policyCases: policy.length,
  errors: records.filter(
    (r) => r.status === "error" || r.status === "invalid_response",
  ).length,
  pending: records.filter((r) => r.status === "pending").length,
  clientDrafts: drafts.length,
  internalNotes: policy.reduce(
    (s, r) => s + (r.response?.messages?.length || 0),
    0,
  ),
  schemaAndHeuristicPassCases: recorded.filter(
    (r) => validateMessages(r.response.messages).length === 0,
  ).length,
  generationAttempts: traces.length,
  rejectedAttempts: traces.filter((t) => t.status === "rejected").length,
  casesWithRepair: recorded.filter((r) => r.response.attempts > 1).length,
  usage: {
    inputTokens,
    outputTokens,
    cachedInputTokens,
    attemptsWithUsage: usages.length,
  },
  latencyMs: {
    median: percentile(0.5),
    p95: percentile(0.95),
    max: latencies.at(-1) ?? null,
  },
  scenarioCounts: scenarios.map((s) => ({
    scenario: s.name,
    total: run.inputSnapshot.filter((c: any) => c.input.scenario === s.id)
      .length,
    recorded: recorded.filter(
      (r) =>
        run.inputSnapshot.find((c: any) => c.id === r.caseId).input.scenario ===
        s.id,
    ).length,
    policy: policy.filter(
      (r) =>
        run.inputSnapshot.find((c: any) => c.id === r.caseId).input.scenario ===
        s.id,
    ).length,
  })),
  qualityJudgment:
    "这些是自动运行/格式统计，不是文案质量评分。AI辅助内容评审另存。",
};
await writeFile(
  `${dirname(file)}/analysis.json`,
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify(summary, null, 2));
