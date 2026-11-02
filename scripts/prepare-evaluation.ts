import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  validateDataset,
  renderCaseTable,
  type CaseRecord,
} from "../lib/evaluation";
const source = await readFile("evaluation/cases.json", "utf8");
const cases = validateDataset(JSON.parse(source).cases);
let records: CaseRecord[] = [];
try {
  const selected = JSON.parse(
    await readFile("evaluation/latest-run.json", "utf8"),
  );
  const run = JSON.parse(await readFile(selected.resultsFile, "utf8"));
  if (run.datasetSha256 !== createHash("sha256").update(source).digest("hex"))
    throw new Error("Selected results do not match current frozen inputs");
  records = run.records;
} catch (e) {
  if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
}
await writeFile("evaluation/TEST_CASES.md", renderCaseTable(cases, records));
console.log(
  `50个输入已校验；${records.length ? "使用已保存的选定运行结果。" : "模型输出保持待运行。"}`,
);
