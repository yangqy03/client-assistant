# 工作日志

日期均为2026年11月2日，时区 America/New_York。仅记录已发生的工作。截图按文件名对应步骤编号；同一步骤的多张截图一并展示，没有截图的单元格留空。

| 步骤 | 做了什么 | 输入 | 输出 | 使用的工具或Agent | 截图 |
|---|---|---|---|---|---|
| 1 | 阅读说明，拆解六场景、A–E和架构要求 | 用户PDF与交付偏好 | 需求清单、虚构数据和不公开说明原文的边界 | Codex、Python/pypdf | ![步骤1截图1](../screenshots/work-log/1-1.png)<br>![步骤1截图2](../screenshots/work-log/1-2.png) |
| 2 | Brainstorm：讨论产品概念、品牌语气、交互与可演示范围 | 开放式挑战；用户希望先看方案 | 初始方案：六场景、三候选、人工选择、本地Demo及50例计划 | Codex；docs/design/PROJECT_PROPOSAL.md | ![步骤2截图1](../screenshots/work-log/2-1.png)<br>![步骤2截图2](../screenshots/work-log/2-2.png) |
| 3 | 比较工具方案：固定模板、直接模型生成、有检查的生成工作流 | 新输入演示需求与事实准确性要求 | 选择实时生成加确定性检查；无密钥时单独展示带标识的固定示例 | Codex；方案比较，未对各方案分别做实验 | ![步骤3截图1](../screenshots/work-log/3.png) |
| 4 | 调研工具如何实现：页面、模型接口和结构化输出 | Next.js、AI SDK文档和安装包源码 | 确定浏览器→本地API→模型→检查→顾问核对的边界与实现方式 | 官方文档、与本地依赖一致的SDK文档、Codex | ![步骤4截图1](../screenshots/work-log/4.png) |
| 5 | 开发本地工作台、六场景、输入编辑、复制和导出 | 用户确认本地开发与Markdown交付 | Next.js/React/TypeScript Demo；Word不再作为交付 | Codex、Sites本地流程 | ![步骤5截图1](../screenshots/work-log/5.png) |
| 6 | 编写首版prompt：角色、语气、三条中文输出、事实边界 | 虚构客户、商品、会话与场景规则 | 系统提示词；历史和商品资料作为数据，不作为覆盖规则的指令 | Codex、AI SDK结构化输出文档 | ![步骤6截图1](../screenshots/work-log/6.png) |
| 7 | 设计并实现初版harness | 输入错误、客户拒绝联系、模型失败等风险 | Zod校验、不联系前置分支、中文/长度/重复等检查、一次修复、45秒超时、失败不替换示例 | Codex、Zod、服务器API | ![步骤7截图1](../screenshots/work-log/7.png) |
| 8 | 软件和浏览器验证，修复本地同源误判 | 六场景及异常请求 | 初版6组测试通过；修复127.0.0.1与localhost差异；验证复制提示和导出 | Node测试、TypeScript、Next.js、CUA |  |
| 9 | 建立文档、架构、演示脚本和本地仓库 | 实际实现与限制 | 报告骨架；PDF和密钥被Git忽略；未公开发布 | Codex、Git | ![步骤9截图1](../screenshots/work-log/9.png) |
| 10 | 按用户反馈简化应用名称并移除品牌专名 | 用户命名偏好 | 只保留客户顾问沟通助手；虚构奢侈皮具背景不命名 | Codex |  |
| 11 | 讨论Agent与RAG的取舍并获得用户确认 | 小规模资料均由顾问输入；用户询问是否需要RAG | 不使用RAG；保留直接上下文，减少索引/检索复杂度；目录扩大后再考虑检索 | Codex、网页资料、docs/design/ARCHITECTURE_NOTES.md | ![步骤11截图1](../screenshots/work-log/11.png) |
| 12 | 围绕不自然的“不必特意回复”开展话术资料检索 | 用户文案反馈；中英文客户维护搜索 | 找到回访应有具体来意、接续需求的参考，形成文案改写 | 网页搜索/阅读工具、Codex | ![步骤12截图1](../screenshots/work-log/12.png) |
| 13 | 按用户要求查找中文话术例子并筛选适用条件 | 中文回访示例、群应用SCRM、Zoho等资料 | 原例与项目原创改写分开；确认有咨询、有购买、无历史三种背景 | 中文网页搜索/阅读、Codex |  |
| 14 | 将中文调研融入Demo与prompt | 用户确认；可核实的虚构历史 | 预设及四字段事实匹配；编辑后回退通用文案；8组测试通过 | Codex、Node测试、CUA | ![步骤14截图1](../screenshots/work-log/14.png) |
| 15 | 阅读用户补充的AC汽车案例，研究服务顾问沟通顺序 | AC汽车文章 | 记录先理解需要、再说明具体帮助与回应异议的借鉴；不照搬汽服诊断与服务承诺 | 网页阅读、Codex | ![步骤15截图1](../screenshots/work-log/15.png) |
| 16 | 阅读销售易与Shopify中文资料，进一步研究工具表达方式 | 用户两篇链接 | 推荐、邀约与价格预设：场景化表达、有依据的产品细节、重视服务体验；12组测试通过 | 网页工具、浏览器公开正文、Codex | ![步骤16截图1](../screenshots/work-log/16.png) |
| 17 | 设计50个测试输入及预期行为 | 六场景、信息缺失、边界和注入风险 | 冻结数据集1.0.0；分布8/9/8/8/8/9；6例注入、2例不联系 | Codex、JSON、TypeScript | ![步骤17截图1](../screenshots/work-log/17.png) |
| 18 | 实现评测harness并尝试真实调用 | 同一生成API、50个冻结输入 | 独立运行目录、输入/提示词快照与哈希；首例503缺配置，余49例未运行 | 评测脚本、本地API |  |
| 19 | 明确Agent职责并重构为受控文案Agent | 用户提出做Agent；现有Next.js/AI SDK项目 | ToolLoopAgent封装模型与规则；无联网、检索、长期记忆或自动发消息；校验由代码负责 | Codex、AI 与当前SDK一致的文档 | ![步骤19截图1](../screenshots/work-log/19.png) |
| 20 | 完善harness的可追踪性，并支持自己的OpenAI密钥 | 用户选择OpenAI；官方API资料 | 接受/拒绝草稿、检查结果和耗时记录；服务器Responses连接；17组软件测试通过 | OpenAI Docs、AI SDK、Node测试 |  |
| 21 | 密钥配置后验证连接，定位余额不足 | 用户本地配置；Mini连接尝试 | 本地502，脱敏诊断确定429 credit_balance_exhausted；停止继续调用 | 本地API、OpenAI诊断 |  |
| 22 | 用户充值并指定Sol后，切换模型并设置生成预算参数 | 用户授权；GPT-6.1 Sol；low推理、1,800输出token上限 | 真实生成成功；记录返回的token用量 | OpenAI Responses、本地API |  |
| 23 | 运行基线50例并逐条AI辅助审阅 | 冻结数据集 | 144条客户草稿、6条内部提示、0接口失败；标记20条建议编辑及3条涉及输入冲突 | 评测harness、Codex定性内容评审 | ![步骤23截图1](../screenshots/work-log/23.png) |
| 24 | 根据实测反馈修订prompt并完整复测 | 问候夹营销、称呼冲突、联系频率和预算措辞 | 明确问候边界、name优先、不定期推荐与提预算限制；同50输入复测，0接口失败 | Codex、OpenAI Responses、评测harness | ![步骤24截图1](../screenshots/work-log/24.png) |
| 25 | 汇总运行、内容问题和延迟，更新中文报告 | 两轮真实运行与逐条评审 | 最新144条客户草稿中3条建议编辑；另6条政策提示 | Codex、统计/报告脚本、CUA | ![步骤25截图1](../screenshots/work-log/25.png) |
| 26 | 按用户要求细化调研、brainstorm与技术设计过程并更新Markdown报告 | 用户文档反馈；已有资料与真实运行记录 | 工作日志补充话术调研、工具设计调研、Agent/RAG取舍、prompt与harness设计；同步更新A、B章节 | Codex、Markdown报告脚本 | ![步骤26截图1](../screenshots/work-log/26.png) |
| 27 | 修复Markdown预览器不支持Mermaid导致架构图显示源码的问题 | 用户截图；原架构流程 | 输出静态PNG和SVG，报告嵌入PNG；模板同步更新，保留Mermaid及DOT图源 | Codex、Graphviz |  |
| 28 | 根据用户偏好将架构图改为英文 | 已验证的架构与图源 | 英文PNG、SVG、Mermaid和DOT图源，中文主报告同步更新 | Codex、Graphviz |  |
| 29 | 按提交需求拆分A–E并准备公开示例Demo | 用户要求；现有报告和应用 | 五份独立Markdown、短提交目录，移除报告API费用估算；公开界面仅示例，实时模型保留本地；18组软件测试与生产构建通过 | Codex、报告脚本、Vercel部署流程 |  |
| 30 | 用户完成Vercel授权后发布公开示例Demo | 用户发布授权与固定示例偏好 | 生产构建READY；无需登录，六场景各返回三条示例，实时请求403，不联系分支200；运行错误扫描无结果 | Vercel、Node HTTP验证、浏览器 |  |

当前：已完成两轮同50案例的真实运行和逐条AI辅助定性审阅；没有独立人类顾问评分或真实客户效果数据。保留两轮输出及评审；部分文案仍建议编辑。公开固定示例Demo已发布并通过线上HTTP与浏览器首页检查，实时Agent保留本地；GitHub仓库由用户发布；未发送邮件。
