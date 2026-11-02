# 客户顾问沟通助手

本地中文微信文案工具，背景为未命名的虚构高端皮具品牌。支持生日/节日、推荐、购后关怀、久别问候、活动邀请、价格异议。所有数据均为虚构，不自动发送消息，不使用RAG。

**在线Demo：[打开客户顾问沟通助手](https://client-advisor-assistant.vercel.app)**（固定示例；无需登录）

## 从这里阅读

先看[提交目录](submission/README.md)，再按需要阅读五份独立报告：

- [A. 工作日志](submission/A_WORK_LOG.md)
- [B. 方法论与英文架构](submission/B_METHODOLOGY.md)
- [C. 50个测试案例与实际输出](submission/C_TEST_CASES.md)
- [D. 评估报告](submission/D_EVALUATION.md)
- [E. 缺陷与下一步](submission/E_DEFECTS_NEXT_STEPS.md)

[提交摘要草稿](SUBMISSION_SUMMARY.md)可供发送给招聘方；已包含GitHub仓库与在线Demo链接。

已用GPT-6.1 Sol完成两轮同50案例测试。每轮48例生成144条客户草稿，2例返回6条内部提示；两轮均无接口失败。已进行逐条AI辅助定性评审，仍有建议编辑项；没有独立人类评分。当前18组软件测试（含新增公开示例部署边界检查）不是模型质量案例。

## 本地启动

使用Node.js 22.13或更新版本（本项目测试环境为25.1）：

```sh
npm ci
npm run dev
```

打开 http://127.0.0.1:3000 。固定示例无需密钥，界面会明确标记来源。它们是预先编写的文字，不能代表实时AI效果。部分场景带可加载的虚构背景，只有四个背景字段与预设匹配时才展示对应细节；改动背景即回退通用示例。

## 使用自己的OpenAI密钥

从Git重新下载后，先在本地复制模板：

```sh
cp .env.example .env.local
```

填写：

```dotenv
MODEL_PROVIDER=openai
OPENAI_API_KEY=在本地填入密钥
OPENAI_MODEL=gpt-6.1-sol
```

不要将密钥发到聊天或提交到Git。修改后重启服务，选择“AI实时生成”。默认模型可改为账户可用且支持结构化输出的模型；当前已对GPT-6.1 Sol运行本项目的冻结测试集。应用直接通过服务器调用OpenAI Responses API，不要求Gateway密钥。旧Gateway连接仅在显式选择`MODEL_PROVIDER=gateway`时启用；不会悄悄切换凭据或输出来源。

实时输入会发送给模型服务。OpenAI连接设置`store:false`，但这不等于对供应商所有日志与保留行为的保证。应用不建立客户数据库；JSON导出和评测文件会保存在本地。请只使用虚构数据。

## Agent与harness

`lib/advisor-agent.ts`使用AI SDK `ToolLoopAgent`封装起草行为。当前没有联网工具、长期记忆或自动执行权限；属于受控生成工作流。应用代码处理输入、联系许可、格式、有限的禁用表达检查和一次修复。共享45秒超时；模型错误不会变成固定示例。

接受/拒绝的结构化候选及检查问题会进入尝试记录，供本地JSON导出与评测保存。不会要求模型输出思维链，也不会把格式通过当作事实准确的证明。

## 检查与评测

```sh
npm test
npm run typecheck
npm run build
npm run eval:prepare
npm run eval:live
npm run report:build
```

先完成实时配置再运行`eval:live`。运行脚本调用与界面相同的本地接口，每次保存独立目录及输入/提示词快照。完整批次最坏可能调用模型96次。两例拒绝联系是政策测试，绕过模型，不计作客户触达文案。

将某次真实结果写入五份报告：

```sh
REPORT_RUN_RESULTS=evaluation/runs/某次运行/results.json npm run report:build
```

不指定结果文件时，报告使用`evaluation/latest-run.json`指向的最近结果；没有该指针时才保持待运行。定性AI评审与独立人类评分必须分开。`report:build`会重新生成提交目录与`submission/`下五份报告，需长期保留的文字调整请同步到`docs/sources/REPORT_TEMPLATE.zh.md`；工作日志维护在`docs/sources/WORK_LOG.md`。详见[evaluation说明](evaluation/README.md)。

## 文件结构

```text
.
├── README.md                      # 项目入口、启动与复现说明
├── SUBMISSION_SUMMARY.md           # 发给招聘方的简短摘要
├── submission/                    # 提交报告：从这里审阅A–E
│   ├── README.md                  # 报告目录
│   ├── A_WORK_LOG.md              # 工作日志，含对应步骤截图
│   ├── B_METHODOLOGY.md           # 方法论与英文架构图
│   ├── C_TEST_CASES.md            # 50个输入、实际输出与预期
│   ├── D_EVALUATION.md            # 两轮测试评价与对照
│   └── E_DEFECTS_NEXT_STEPS.md     # 缺陷、人工审核计划与下一步
├── app/                           # 页面、样式与生成API
├── lib/                           # Agent、模型配置与校验
├── tests/                         # 软件回归测试
├── scripts/                       # 评测和报告生成脚本
├── evaluation/                    # 冻结输入与不可改写的运行证据
│   ├── cases.json
│   ├── latest-run.json
│   ├── runs/                      # 两轮完整结果及早期失败记录
│   └── smoke/                     # 脱敏连接诊断
├── docs/
│   ├── sources/                   # 工作日志源文件与报告模板
│   ├── design/                    # 初期方案与架构说明
│   ├── diagrams/                  # 英文PNG、SVG及可编辑图源
│   ├── screenshots/
│   │   ├── work-log/              # 按步骤编号的AI对话截图
│   │   └── app/                   # 应用界面验证截图
│   ├── CHINESE_COPY_REFERENCES.md # 中文调研资料与取舍
│   ├── DEMO_SCRIPT.md             # 演示录屏脚本
│   └── DEPLOYMENT.md              # 公开部署与验证记录
└── .env.example                   # 无密钥的配置模板
```

`submission/`是给审阅者看的报告；`docs/sources/`用于维护和重新生成报告。截图和架构图均使用仓库内相对链接。原始测试数据与运行文件保留原路径，便于复查。

## 公开Demo与仓库

公开部署使用`NEXT_PUBLIC_DEMO_ONLY=1`，界面只提供固定示例，服务器也拒绝实时生成请求。公开环境不配置OpenAI密钥。本地不设置此变量即可使用实时Agent。
