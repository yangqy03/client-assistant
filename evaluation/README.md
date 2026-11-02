# 50-case evaluation

## 当前状态

- 使用GPT-6.1 Sol完成两轮同50输入运行：0.1.5基线与0.1.6修订。
- 每轮48例模型生成（144条客户草稿）与2例确定性不联系提示（6条）；两轮接口错误均为0。
- 最新结果由`latest-run.json`指向。每轮有`results.json`、`summary.json`、`analysis.json`、`content-review.json`与该轮完整表格。
- `content-review.json`是Codex逐条AI辅助定性判断，不是人工评分；初版20条建议编辑、3条涉及输入冲突，修订版3条建议编辑。不能把这些判断当作真实客户接受率。
- 历史缺密钥/余额不足的尝试保留，不能与成功批次混用。

## Prepare / validate inputs

```sh
npm run eval:prepare
```

This validates 50 unique cases and the six-scenario distribution, then regenerates the pending table. It does not call a model and does not modify the JSON source.

## Run the actual application

1. Configure `.env.local` using `.env.example`, set `MODEL_PROVIDER=openai`, `OPENAI_API_KEY` and optionally `OPENAI_MODEL`, then restart `npm run dev`. Keep the key out of source control and chat.
2. Verify a live generation in the app.
3. Run:

```sh
npm run eval:live
```

The runner makes sequential live requests to the same local `/api/generate` endpoint used by the demo. It is restricted to loopback hosts. A full run can incur up to 96 model calls: 48 contact-allowed cases, each with at most one heuristic repair attempt. No-contact cases bypass the model.

Each run is saved in its own `runs/<timestamp>-v<version>/` directory, containing:

- `results.json`: full frozen inputs, dataset/prompt hashes, prompt snapshot, HTTP responses, timestamps, elapsed time and statuses.
- `TEST_CASES.md`: the same required columns, populated only with actual recorded outputs.
- `summary.json`: counts of recorded outputs, policy abstentions, errors and unrun cases.

The runner stops on missing server configuration, server version mismatch or a request failure. It preserves failures and never fabricates missing text. Original input and run files should be retained when changing the prompt or tool.

Since application 0.1.4, the route includes structured accepted/rejected draft attempts and their check issues. Provider/schema failures record only a generic error; raw text that failed provider parsing is not retained. Hidden reasoning and raw provider errors are not collected. These are application-level traces, not complete provider logs.

## Quality review

Successful HTTP responses are labeled `output_recorded`, not “quality passed”. Review all recorded outputs against `expectedBehavior` and the rubric in [Methodology](../submission/B_METHODOLOGY.md). Score grounding, voice, personalization, scenario fit, natural Chinese and boundaries separately. Judge diversity at case level. Record unsupported claims and boundary failures separately from averages. Label human vs AI-assisted judging; do not infer sales conversion from this small fictional set.

For no-contact cases, verify the abstention disposition and internal guidance rather than scoring outreach style. A full contact-allowed run yields up to 144 client-facing drafts plus six internal notes; these two output types must be reported separately.
