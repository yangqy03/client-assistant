import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, posix } from "node:path";
import {
  validateDataset,
  renderCaseTable,
  type CaseRecord,
} from "../lib/evaluation";
import { VERSION } from "../lib/studio";
async function optionalJson(file: string) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
}
const source = await readFile("evaluation/cases.json", "utf8");
const cases = validateDataset(JSON.parse(source).cases);
const latest = await optionalJson("evaluation/latest-run.json");
const resultsFile = process.env.REPORT_RUN_RESULTS || latest?.resultsFile;
let records: CaseRecord[] = [];
let runStatus = "未选择实际结果文件；下面输出保持待运行。";
let completion =
  "测试输入已完成；未选择实际运行结果，不能视为生成与评价已完成。";
let metrics = "尚无选定运行的统计。";
let quality = "尚无逐条内容评审记录。";
let comparison = "尚无可用的前后对照。";
const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
if (resultsFile) {
  const run = JSON.parse(await readFile(resultsFile, "utf8"));
  if (run.datasetSha256 !== createHash("sha256").update(source).digest("hex"))
    throw new Error("结果与当前冻结数据集不一致，不能混合。");
  records = run.records;
  const analysis = await optionalJson(`${dirname(resultsFile)}/analysis.json`);
  const review = await optionalJson(
    `${dirname(resultsFile)}/content-review.json`,
  );
  if (review && review.runId !== run.runId)
    throw new Error("评审与运行ID不一致。");
  const count = (s: string) => records.filter((r) => r.status === s).length;
  runStatus = `模型：${run.expectedModel}。已记录模型输出${count("output_recorded")}例、内部政策提示${count("policy_abstention")}例、错误/无效响应${count("error") + count("invalid_response")}例、未运行${count("pending")}例。原始结果：[results.json](${resultsFile})。`;
  completion =
    count("output_recorded") === 48 && count("policy_abstention") === 2
      ? `本轮50例已完成：48例产生144条真实客户草稿，2例产生6条内部提示。${review ? "已完成逐条AI辅助定性评审，尚未进行独立人工评审。" : "内容评审尚未完成。"}软件格式检查不等于文案质量通过。`
      : runStatus;
  if (analysis)
    metrics = `| 指标 | 本轮结果 |\n|---|---|\n| 模型/政策案例 | ${analysis.recordedCases} / ${analysis.policyCases} |\n| 客户草稿/内部提示 | ${analysis.clientDrafts} / ${analysis.internalNotes} |\n| 接口错误/未运行 | ${analysis.errors} / ${analysis.pending} |\n| 模型案例基础检查通过 | ${analysis.schemaAndHeuristicPassCases} / ${analysis.recordedCases} |\n| 模型生成尝试/触发修复 | ${analysis.generationAttempts} / ${analysis.casesWithRepair} |\n| 中位延迟/P95 | ${(analysis.latencyMs.median / 1000).toFixed(2)}秒 / ${(analysis.latencyMs.p95 / 1000).toFixed(2)}秒 |\n| 返回的输入/输出token | ${analysis.usage.inputTokens} / ${analysis.usage.outputTokens} |`;
  if (review) {
    const s = review.summary;
    const flagged = review.caseReviews.filter((c: any) =>
      c.candidates.some((m: any) =>
        ["needs_edit", "input_conflict"].includes(m.verdict),
      ),
    );
    quality = `本轮由Codex逐条进行AI辅助定性案头评审；不是人类顾问评审、盲评或独立事实核实，也未额外调用付费评委模型。采用“可用草稿/建议编辑/输入冲突/内部政策提示”分类，未给出未经校准的1–5分。\n\n| 判断 | 数量 |\n|---|---|\n| 可用草稿（仍需顾问确认） | ${s.acceptable_draft} |\n| 建议编辑 | ${s.needs_edit} |\n| 输入冲突需核实 | ${s.input_conflict} |\n| 正确内部政策提示 | ${s.internal_policy} |\n\n${flagged.length ? "仍需关注的具体内容：\n\n| 案例 | 候选 | 发现 |\n|---|---|---|\n" + flagged.flatMap((c: any) => c.candidates.filter((m: any) => ["needs_edit", "input_conflict"].includes(m.verdict)).map((m: any) => `| ${c.caseId} | ${m.candidate} | ${esc(m.comment)} |`)).join("\n") : "本轮未标记明显需编辑项，但不代表真实客户一定接受。"}\n\n完整逐条判定与对应文本哈希见[内容评审记录](${dirname(resultsFile)}/content-review.json)。对候选差异的观察：缺少工艺、保修或活动信息时，多条表达仍较相近；不能为制造差异补造事实。`;
  }
  const baselineFile =
    "evaluation/runs/2026-11-02T18-47-28-439Z-v0.1.5/results.json";
  const baseline = await optionalJson(baselineFile);
  const baseReview = await optionalJson(
    `${dirname(baselineFile)}/content-review.json`,
  );
  if (baseline && run.appVersion !== "0.1.5") {
    const pairs: [
      [string, number, string],
      ...Array<[string, number, string]>,
    ] = [
      ["TC-002", 2, "纯问候不引导选购"],
      ["TC-004", 1, "生日日期未确认时不转向业务"],
      ["TC-006", 1, "明确结构化name优先；输入原本存在冲突"],
      ["TC-032", 3, "明确没有相关更新不主动推荐"],
      ["TC-042", 3, "不建议为了商品提高预算"],
    ];
    const lines = pairs.map(([id, n, why]) => {
      const a =
        baseline.records.find((r: any) => r.caseId === id)?.response
          ?.messages?.[n - 1] || "无输出";
      const b = records.find((r) => r.caseId === id)?.response?.messages as
        string[] | undefined;
      return `| ${id} / 候选${n} | ${esc(a)} | ${esc(b?.[n - 1] || "无输出")} | ${why} |`;
    });
    comparison = `两轮使用相同数据集与模型，分别保留提示词快照。两轮各完成50例；第二轮完整输出列在C。\n\n| 案例 | 第一轮原文 | 第二轮原文 | 修订目的 |\n|---|---|---|---|\n${lines.join("\n")}\n\n${baseReview ? `第一轮AI辅助判断：${baseReview.summary.acceptable_draft}条可用草稿、${baseReview.summary.needs_edit}条建议编辑、${baseReview.summary.input_conflict}条涉及输入冲突，另有6条内部提示。` : ""}\n\n这是单次前后对照，存在生成随机性；不构成统计显著的提升证明。TC-006本来同时出现苏女士和林女士，基线问题不能简单归因于模型；修订后在提示词中明确name字段优先，数据原样保留用于观察处理方式。基线记录：[原始结果](${baselineFile})、[逐条评审](${dirname(baselineFile)}/content-review.json)。`;
  }
}
const table = renderCaseTable(cases, records),
  split = table.indexOf("## 预期行为与测试类型");
// Resolve links from each source document before assembling submission files.
function sourceLinks(markdown: string, directory: string) {
  return markdown.replace(/\]\(([^)]+)\)/g, (match, target: string) => {
    if (/^(?:[a-z]+:|#|\/)/i.test(target)) return match;
    return `](${posix.normalize(posix.join(directory, target))})`;
  });
}
const log = sourceLinks(await readFile("docs/sources/WORK_LOG.md", "utf8"), "docs/sources");
const values = {
  VERSION,
  WORK_LOG: log.slice(log.indexOf("| 步骤"), log.indexOf("\n\n当前：")).trim(),
  CASE_TABLE: table.slice(table.indexOf("| 案例编号 | 场景"), split).trim(),
  EXPECTATIONS: table.slice(table.indexOf("| 案例编号 | 标题", split)).trim(),
  RUN_STATUS: runStatus,
  COMPLETION: completion,
  METRICS: metrics,
  QUALITY_SUMMARY: quality,
  COMPARISON: comparison,
};
let template = sourceLinks(await readFile("docs/sources/REPORT_TEMPLATE.zh.md", "utf8"), "docs/sources");
for (const [key, value] of Object.entries(values))
  template = template.replace(`{{${key}}}`, value);
const filenames = ["A_WORK_LOG.md", "B_METHODOLOGY.md", "C_TEST_CASES.md", "D_EVALUATION.md", "E_DEFECTS_NEXT_STEPS.md"];
const sections = template.split(/(?=^## [A-E]\. )/m).slice(1);
if (sections.length !== filenames.length) throw new Error("报告必须包含A–E五节。");
await mkdir("submission", { recursive: true });
for (const [index, section] of sections.entries()) {
  const body = section.replace(/^## ([A-E]\. .*)/m, "# $1")
    .replace(/\]\((docs\/|evaluation\/|screenshots\/)/g, "](../$1");
  await writeFile(`submission/${filenames[index]}`, `${body.trim()}\n\n[返回提交目录](README.md)\n`);
}
const overview = `# 客户顾问沟通助手：提交目录

在线Demo：[客户顾问沟通助手](https://client-advisor-assistant.vercel.app)（固定示例；无需登录）。

六种沟通场景、三条中文微信草稿；所有客户和产品资料均为虚构。架构图为英文，其余报告为中文。现有截图按步骤整理在工作日志中；录屏由作者后续补充。

${completion}

| 部分 | 内容 |
|---|---|
| [A. 工作日志](A_WORK_LOG.md) | 调研、brainstorm、开发与迭代过程 |
| [B. 方法论与架构](B_METHODOLOGY.md) | Prompt、Agent、无RAG的取舍、harness与英文架构图 |
| [C. 50个测试案例](C_TEST_CASES.md) | 完整输入、三条真实输出与每例预期行为 |
| [D. 评估报告](D_EVALUATION.md) | 运行证据、AI辅助评价及修订前后对照 |
| [E. 缺陷与下一步](E_DEFECTS_NEXT_STEPS.md) | 已修复问题、剩余限制与复现方法 |

已使用同一组50输入完成两轮运行。最新144条客户草稿中，AI辅助评审标记3条建议编辑；另有6条内部不联系提示。尚无独立人类评分，不能将接口成功等同于文案质量或客户效果。

公开Demo仅展示明确标注的固定示例，不调用付费模型。实时Agent可在本地配置服务器端密钥后运行。源码、冻结输入与原始运行记录均在本仓库；启动方式见[README](../README.md)。
`;
await writeFile("submission/README.md", overview);
console.log("已生成提交目录与A–E五份Markdown；报告不包含API费用估算。");
