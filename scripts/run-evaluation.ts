import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  validateDataset,
  renderCaseTable,
  type CaseRecord,
} from "../lib/evaluation";
import { outputSchema, VERSION, policy } from "../lib/studio";
const base = new URL(
  process.env.EVALUATION_BASE_URL || "http://127.0.0.1:3000",
);
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname))
  throw new Error("Evaluation runner only supports the local demo");
const source = await readFile("evaluation/cases.json", "utf8");
const dataset = JSON.parse(source);
const cases = validateDataset(dataset.cases);
const startedAt = new Date().toISOString();
const runId = `${startedAt.replace(/[:.]/g, "-")}-v${VERSION}`;
const folder = `evaluation/runs/${runId}`;
await mkdir(folder, { recursive: true });
const records: CaseRecord[] = cases.map((c) => ({
  caseId: c.id,
  status: "pending",
}));
const run = {
  runId,
  startedAt,
  completedAt: null as string | null,
  appVersion: VERSION,
  datasetVersion: dataset.datasetVersion,
  datasetSha256: createHash("sha256").update(source).digest("hex"),
  promptSha256: createHash("sha256").update(policy).digest("hex"),
  promptSnapshot: policy,
  expectedModel: "gpt-6.1-sol",
  generationSettings: {
    reasoningEffort: "low",
    maxOutputTokens: 1800,
    maxRepairAttempts: 1,
  },
  inputSnapshot: cases,
  qualityReview:
    "pending — automatic recording does not establish factuality or style",
  blockedReason: null as string | null,
  records,
};
async function save() {
  await writeFile(
    `${folder}/results.json`,
    JSON.stringify(run, null, 2) + "\n",
  );
  await writeFile(`${folder}/TEST_CASES.md`, renderCaseTable(cases, records));
}
await save();
let consecutiveProviderErrors = 0;
for (let i = 0; i < cases.length; i++) {
  const c = cases[i];
  const record = records[i];
  record.requestedAt = new Date().toISOString();
  const start = Date.now();
  try {
    const response = await fetch(new URL("/api/generate", base), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(c.input),
      signal: AbortSignal.timeout(55000),
    });
    record.elapsedMs = Date.now() - start;
    record.httpStatus = response.status;
    const body: unknown = await response.json();
    record.response =
      typeof body === "object" && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : { raw: body };
    if (!response.ok) {
      record.status = "error";
      record.error =
        typeof record.response.error === "string"
          ? record.response.error
          : `HTTP ${response.status}`;
      if (response.status === 503) {
        run.blockedReason =
          "Live model is not configured on the server. No sample fallback was used.";
        await save();
        break;
      }
      consecutiveProviderErrors =
        response.status >= 500 ? consecutiveProviderErrors + 1 : 0;
      if (consecutiveProviderErrors >= 2) {
        run.blockedReason =
          "Two consecutive server/provider errors; stopped to avoid repeated paid failures";
        await save();
        break;
      }
    } else {
      consecutiveProviderErrors = 0;
      const valid = outputSchema.safeParse(body);
      const expectedMode = c.input.contactAllowed ? "live" : "policy";
      if (
        !valid.success ||
        record.response.mode !== expectedMode ||
        record.response.version !== VERSION ||
        (c.input.contactAllowed && record.response.model !== "gpt-6.1-sol")
      ) {
        record.status = "invalid_response";
        record.error =
          "Unexpected schema, output provenance or server version; see recorded response";
        if (
          record.response.version !== VERSION ||
          (c.input.contactAllowed && record.response.model !== "gpt-6.1-sol")
        ) {
          run.blockedReason =
            "Server version or model differs from this authorized Sol run; restart or check configuration";
          await save();
          break;
        }
      } else
        record.status = c.input.contactAllowed
          ? "output_recorded"
          : "policy_abstention";
    }
  } catch {
    record.elapsedMs = Date.now() - start;
    record.status = "error";
    record.error = "Local server request failed or timed out";
    run.blockedReason =
      "Local server request failed; remaining inputs were not run";
    await save();
    break;
  }
  console.log(`${c.id}: ${record.status}`);
  await save();
}
run.completedAt = new Date().toISOString();
await save();
const summary = {
  runId,
  outputsRecorded: records.filter((r) => r.status === "output_recorded").length,
  policyAbstentions: records.filter((r) => r.status === "policy_abstention")
    .length,
  errors: records.filter(
    (r) => r.status === "error" || r.status === "invalid_response",
  ).length,
  notRun: records.filter((r) => r.status === "pending").length,
  blockedReason: run.blockedReason,
};
await writeFile(
  `${folder}/summary.json`,
  JSON.stringify(summary, null, 2) + "\n",
);
console.log(JSON.stringify({ ...summary, folder }, null, 2));
if (run.blockedReason || summary.errors) process.exitCode = 1;
