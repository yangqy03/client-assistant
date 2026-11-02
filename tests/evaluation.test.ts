import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { validateDataset, renderCaseTable } from "../lib/evaluation";
import {
  scenarioExamples,
  initialInput,
  sampleMessages,
  validateMessages,
} from "../lib/studio";
const dataset = JSON.parse(readFileSync("evaluation/cases.json", "utf8"));
test("50 cases cover six scenarios with unique IDs and complete valid inputs", () => {
  const cases = validateDataset(dataset.cases);
  assert.equal(cases.length, 50);
  assert.equal(cases.filter((c) => !c.input.contactAllowed).length, 2);
  assert.equal(cases.filter((c) => c.category === "injection").length, 6);
  assert.equal(new Set(cases.map((c) => JSON.stringify(c.input))).size, 50);
});
test("evaluation preparation labels missing outputs rather than filling them with samples", () => {
  const table = renderCaseTable(validateDataset(dataset.cases));
  assert.equal((table.match(/待实时生成/g) || []).length, 151); // 150 cells plus introductory warning.
  assert.ok(!table.includes("CURATED EXAMPLE"));
});
test("rejected or partial responses are not presented as successful model outputs", () => {
  const cases = validateDataset(dataset.cases);
  const table = renderCaseTable(cases, [
    {
      caseId: "TC-001",
      status: "error",
      response: { error: "missing key" },
      error: "missing key",
    },
    {
      caseId: "TC-002",
      status: "invalid_response",
      response: { messages: ["only one"] },
    },
  ]);
  assert.ok(table.includes("运行失败：missing key"));
  assert.ok(table.includes("响应无效；见原始JSON记录"));
  assert.ok(!table.includes("only one"));
  const invalidMode = renderCaseTable(cases, [
    {
      caseId: "TC-001",
      status: "invalid_response",
      response: {
        mode: "sample",
        messages: ["固定示例一", "固定示例二", "固定示例三"],
      },
    },
  ]);
  assert.ok(!invalidMode.includes("固定示例一"));
});
test("new product, event and price samples only reference exact known fictional fixtures", () => {
  for (const scenario of ["recommendation", "event", "price"] as const) {
    const example = scenarioExamples[scenario]![0];
    const input = { ...initialInput, scenario, ...example.data };
    assert.deepEqual(sampleMessages(input), example.messages(input.name));
    assert.deepEqual(validateMessages(sampleMessages(input)), []);
    const edited = { ...input, history: "没有可核实的历史。" };
    assert.notDeepEqual(sampleMessages(edited), example.messages(input.name));
    assert.ok(
      sampleMessages(edited).every(
        (m) => !/8,600|7,000|11月15日|28 × 20/.test(m),
      ),
    );
  }
});
