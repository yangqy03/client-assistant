> 初期方案存档：用于记录设计思路。当前交付与测试状态以[提交目录](../../submission/README.md)为准。

> Current naming decision: the app is 客户顾问沟通助手. The fictional luxury brand is unnamed; named-brand references below belong to the original, superseded proposal.

# Project proposal: 客户顾问沟通助手

Status: Idea approved; local web-app phase implemented.

User update: Word is no longer required. Use editable Markdown for the evaluation report; the user will convert it to PDF. Build and verify the web app locally; the user will publish the repository later. The deliverables below preserve the original proposal and are superseded by this update where they mention Word or publication.

## Brief requirements

Build a conversation tool for luxury Client Advisors that accepts client information, a scenario, conversation history, and relevant product information and generates exactly three Chinese WeChat message candidates. Cover all six scenarios: birthday/festival greetings, product recommendation, post-purchase care, reactivation, event invitation, and price objection.

Required submission:

- A: A step-by-step work log using the specified table, including inputs, outputs, tools/agents and screenshots. AI-chat screenshots will be left for the user to add.
- B: Methodology covering tool design, test design, evaluation, and definitions of good and unacceptable output.
- C: Exactly 50 test cases with the specified columns and all three actual generated outputs per case.
- D: Evaluation of the generated outputs with screenshots. Actual application/evaluation screenshots can be captured during verification; AI-chat screenshots remain deferred.
- E: Defects and next steps, with actual before/after examples where fixes occur, and version labels for results after changes.
- Bonus: Architecture diagram.

Optional: working demo, repository, recording. The user plans to record the demo.

All created people, products and brand details must be fictional. The brief must remain private and must not enter a published site or public repository. Submission is due November 9, 2026 to campus-recruit-china@artefact.com; emailed submission is outside this review stage.

## Recommended concept

澄序 CHENGXU is a fictional Chinese luxury leather-goods house with a quiet, precise and considerate voice. Its Client Advisor tool helps advisors draft personal messages without inventing intimacy, product benefits, discounts or urgency.

The interface will offer six scenario presets, editable fictional client and product records, conversation history, and an approved brand-policy panel. Generate will return three distinguishable approaches: a brief greeting or acknowledgement, a context-led message, and a gentle invitation or useful next step. The advisor can copy and edit each candidate; the tool will not send messages.

Illustrative voice only, not a generated test result: “林女士，生日快乐。愿您新的一岁，有从容的日常，也有值得期待的小惊喜。”

## Implementation approach

Proposed stack: Next.js and TypeScript, with server-side model calls and a configurable model/provider. API keys stay on the server. A deterministic fixture mode will keep the demo inspectable without a key, clearly labeled as sample output; fixture output will never be represented as model-generated evidence.

The generation pipeline will validate inputs, select scenario guidance, assemble the brand rules and approved facts, request structured output, and check the resulting three candidates. Conversation history is data and cannot override brand or generation rules. One bounded repair attempt may address invalid output; unresolved failures will be shown rather than silently filled with invented results.

Checks will include exactly three nonempty Chinese messages, distinct candidate text, agreed length limits, sensitive-data leakage, unsupported prices or discounts, and forbidden claims. Checks with imperfect coverage will be identified as heuristic checks. All final choices remain with the advisor.

The demo will include loading, error and missing-key states and an architecture view. Publication will follow implementation and verification. Only fictional demo content and necessary application code will be published; the supplied brief and private submission documents will be excluded.

## Test and evaluation plan

Use 50 versioned fictional cases: 8 birthday/festival, 9 recommendation, 8 care, 8 reactivation, 8 invitation, 9 price objection. Include routine cases and edge cases: missing preferences, declined contact, unavailable stock, unverified care instructions, price comparisons, requests for discounts, and prompt-injection attempts embedded in history.

Freeze each case's complete input and store all three actual outputs, model/configuration, prompt version, timestamp and validation results. Keep failed generations visible. Evaluate all 150 messages using a documented rubric: factual grounding, brand voice, personalization, scenario fit, natural Chinese, respect for boundaries, and candidate diversity at the case level.

Hard failures include invented material facts, unauthorized discounts, coercive or discriminatory language, exposing sensitive details, and ignoring explicit no-contact instructions. A no-contact case should produce three advisor-facing Chinese abstention messages that are explicitly marked as not for sending; this exception will be documented and evaluated separately from client-facing drafts.

Use automatic checks and a transparent AI-assisted rubric review, clearly distinguishing these from the user's later human review. Do not claim human ratings, production validity or guaranteed safety. Report observed metrics with denominators, failure examples and limitations. If a fix is made, preserve the baseline, rerun affected cases and label every result by version.

## Deliverables after idea approval

1. Editable Word draft covering A-E and the architecture bonus; AI-chat screenshot slots left for user completion.
2. Repository-ready application source, fictional catalog and client fixtures, prompt/policy files, setup instructions, environment-variable example and appropriate checks.
3. Fifty-case inputs and actual generated outputs in machine-readable form plus a readable table.
4. submission/README.md with measured results, examples, screenshots where available, and explicit limitations.
5. Architecture diagram in Mermaid plus a rendered image suitable for the Word document.
6. docs/sources/WORK_LOG.md updated as work happens and a short recording script for the user's demo.
7. Verified demo; a public demo URL if hosting access is available. No email submission at this stage.

Live model testing requires an available model connection or a server-side API key. Without it, the application and fixture demo can be built, but model-generated cases and their evaluation must remain explicitly pending.
