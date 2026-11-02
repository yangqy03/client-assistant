"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  Check,
  ChevronDown,
  Copy,
  Feather,
  Layers3,
  LoaderCircle,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import {
  initialInput,
  scenarioExamples,
  matchingScenarioExample,
  scenarios,
  VERSION,
  type StudioInput,
} from "../lib/studio";
type Result = {
  messages: string[];
  mode: string;
  version: string;
  generatedAt: string;
  model?: string;
  disposition: string;
  checks: string[];
};
const publicDemoOnly = process.env.NEXT_PUBLIC_DEMO_ONLY === "1";

export default function Home() {
  const [input, setInput] = useState<StudioInput>({ ...initialInput });
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<number | null>(null);
  const [guide, setGuide] = useState(false);
  const [tab, setTab] = useState<"context" | "brand">("context");
  const outputRef = useRef<HTMLElement>(null);
  const guideRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (guide) guideRef.current?.showModal();
    else guideRef.current?.close();
  }, [guide]);
  const scenario = scenarios.find((s) => s.id === input.scenario)!;
  function change<K extends keyof StudioInput>(key: K, value: StudioInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    setResult(null);
    setError("");
  }
  async function generate() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "暂时无法生成，请稍后再试。");
      setResult(data);
      if (window.innerWidth < 1000)
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "请求失败，请重试。");
    } finally {
      setBusy(false);
    }
  }
  async function copy(text: string, i: number) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      setError("复制失败，请手动选中文案复制。");
    }
  }
  function download() {
    if (!result) return;
    const a = document.createElement("a");
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ input, ...result }, null, 2)], {
        type: "application/json",
      }),
    );
    a.href = url;
    a.download = `advisor-${input.scenario}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="studio">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="客户顾问沟通助手首页">
          <span className="app-title">
            客户顾问
            <br />
            沟通助手
          </span>
        </a>
        <div className="side-rule" />
        <p className="eyebrow side-label">ADVISOR WORKSPACE</p>
        <div className="active-nav">
          <MessageCircle size={17} />
          <span>客户顾问沟通助手</span>
          <span className="nav-dot" />
        </div>
        <div className="side-section">
          <span>沟通场景</span>
          <span>06</span>
        </div>
        <nav aria-label="沟通场景">
          {scenarios.map((s) => (
            <button
              disabled={busy}
              key={s.id}
              className={`scenario-nav ${input.scenario === s.id ? "selected" : ""}`}
              onClick={() => {
                setInput((p) => ({
                  ...p,
                  scenario: s.id,
                  context: s.context,
                  ...(scenarioExamples[s.id]?.[0]?.data || {}),
                }));
                setResult(null);
                setError("");
              }}
            >
              <span className="scenario-num">{s.icon}</span>
              <span>{s.name}</span>
              {input.scenario === s.id && <ArrowRight size={14} />}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <div className="brand-note">
            <Feather size={20} />
            <p>
              言有分寸，
              <br />
              心意自成。
            </p>
          </div>
          <button className="guide-button" onClick={() => setGuide(true)}>
            <Layers3 size={15} />
            工作台说明
            <ArrowRight size={14} />
          </button>
          <div className="advisor-avatar">
            <span>顾</span>
            <div>
              客户顾问<small>虚构品牌 · 演示工作区</small>
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="breadcrumb">客户关系</span>
            <span className="slash">/</span>客户顾问沟通助手
          </div>
          <span className="status">
            <span />
            {publicDemoOnly ? "公开示例工作区" : "本地工作区"} <span className="version">v{VERSION}</span>
          </span>
        </header>
        <div className="workspace">
          <div className="page-heading">
            <div>
              <p className="eyebrow">THE ART OF CONVERSATION</p>
              <h1>
                让每一次沟通，<em>恰如其分。</em>
              </h1>
              <p className="intro">
                从了解客户开始，为每一段关系找到合适的表达。
              </p>
            </div>
            <div className="edition">
              <span>顾问手记</span>
              <small>PERSONAL. CONSIDERED. HUMAN.</small>
            </div>
          </div>
          <div className="workspace-grid">
            <section className="input-panel" aria-label="编辑沟通背景">
              <div className="panel-tabs">
                <button
                  className={tab === "context" ? "tab-active" : ""}
                  onClick={() => setTab("context")}
                >
                  沟通背景
                </button>
                <button
                  className={tab === "brand" ? "tab-active" : ""}
                  onClick={() => setTab("brand")}
                >
                  品牌准则 <ShieldCheck size={13} />
                </button>
              </div>
              {tab === "brand" ? (
                <div className="policy-content">
                  <p className="eyebrow">COMMUNICATION PRINCIPLES</p>
                  <h2>克制而温暖，真诚有分寸。</h2>
                  <p>
                    本演示以虚构的高端皮具品牌为背景。好的表达来自倾听，而非说服。
                  </p>
                  <ol>
                    <li>
                      <strong>场景中的价值</strong>
                      把已确认的材质、尺寸、背法与客户明确的使用场景联系起来，不用“身份象征”等套话，也不虚构工艺或品牌故事。
                    </li>
                    <li>
                      <strong>事实先行</strong>
                      只使用已提供的产品信息。不虚构库存、优惠、活动或功效。
                    </li>
                    <li>
                      <strong>尊重选择</strong>
                      不催促、不制造稀缺感。客户拒绝联系时，停止生成可发送文案。
                    </li>
                    <li>
                      <strong>恰当的亲近</strong>
                      不用敏感信息，不假装了解客户的私人生活。
                    </li>
                    <li>
                      <strong>价格坦诚</strong>
                      理解预算，以真实信息回应，不承诺未经批准的折扣。
                    </li>
                  </ol>
                  <p className="policy-foot">
                    规则检查为辅助检查，无法保证识别全部问题。发送前请由顾问确认。
                  </p>
                </div>
              ) : (
                <div className="form-body">
                  <div className="field-head">
                    <label htmlFor="scenario">沟通场景</label>
                    <span>01 / CONTEXT</span>
                  </div>
                  <div className="select-wrap">
                    <select
                      id="scenario"
                      disabled={busy}
                      value={input.scenario}
                      onChange={(e) => {
                        const s = scenarios.find(
                          (s) => s.id === e.target.value,
                        )!;
                        setInput((p) => ({
                          ...p,
                          scenario: s.id,
                          context: s.context,
                          ...(scenarioExamples[s.id]?.[0]?.data || {}),
                        }));
                        setResult(null);
                        setError("");
                      }}
                    >
                      {scenarios.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                  {Boolean(scenarioExamples[input.scenario]?.length) && (
                    <div className="example-presets">
                      <p>
                        加载虚构背景{" "}
                        <span>会替换下方画像、记录、目的与产品信息</span>
                      </p>
                      <div>
                        {(scenarioExamples[input.scenario] || []).map(
                          (example) => (
                            <button
                              key={example.id}
                              disabled={busy}
                              className={
                                matchingScenarioExample(input)?.id ===
                                example.id
                                  ? "chosen"
                                  : ""
                              }
                              onClick={() => {
                                setInput((p) => ({ ...p, ...example.data }));
                                setResult(null);
                                setError("");
                              }}
                            >
                              {example.label}
                            </button>
                          ),
                        )}
                      </div>
                      <small>
                        {matchingScenarioExample(input)
                          ? "示例文案仅引用当前预设中已明确提供的事实。"
                          : "背景已编辑：示例模式将使用不引用历史事实的通用文案。"}
                      </small>
                    </div>
                  )}
                  <div className="field-head">
                    <label htmlFor="name">客户称呼</label>
                    <span>FICTIONAL CLIENT</span>
                  </div>
                  <input
                    id="name"
                    maxLength={30}
                    disabled={busy}
                    value={input.name}
                    onChange={(e) => change("name", e.target.value)}
                  />
                  <label htmlFor="client">
                    客户画像 <span className="optional">偏好与需求</span>
                  </label>
                  <textarea
                    id="client"
                    disabled={busy}
                    maxLength={2000}
                    rows={2}
                    value={input.client}
                    onChange={(e) => change("client", e.target.value)}
                  />
                  <label htmlFor="history">
                    会话记录 <span className="optional">保留必要的上下文</span>
                  </label>
                  <textarea
                    id="history"
                    disabled={busy}
                    maxLength={4000}
                    rows={3}
                    value={input.history}
                    onChange={(e) => change("history", e.target.value)}
                  />
                  <label htmlFor="context">本次沟通目的</label>
                  <textarea
                    id="context"
                    disabled={busy}
                    maxLength={2000}
                    rows={2}
                    value={input.context}
                    onChange={(e) => change("context", e.target.value)}
                  />
                  <label htmlFor="product">
                    产品与活动信息{" "}
                    <span className="optional">仅填写已确认的事实</span>
                  </label>
                  <textarea
                    id="product"
                    disabled={busy}
                    maxLength={2000}
                    rows={4}
                    value={input.product}
                    onChange={(e) => change("product", e.target.value)}
                  />
                  <label className="contact-setting">
                    <input
                      type="checkbox"
                      disabled={busy}
                      checked={input.contactAllowed}
                      onChange={(e) =>
                        change("contactAllowed", e.target.checked)
                      }
                    />
                    <span>客户允许接收本次联系</span>
                  </label>
                </div>
              )}
              <div className="generate-area">
                <div className="mode-row">
                  <label htmlFor="mode">生成方式</label>
                  <select
                    disabled={busy}
                    id="mode"
                    value={input.mode}
                    onChange={(e) =>
                      change("mode", e.target.value as StudioInput["mode"])
                    }
                  >
                    <option value="sample">示例模式 · 无需密钥</option>
                    {!publicDemoOnly && <option value="live">AI 实时生成</option>}
                  </select>
                </div>
                <button
                  className="generate"
                  disabled={busy || !input.name.trim() || !input.context.trim()}
                  onClick={generate}
                >
                  {busy ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Sparkles size={17} />
                  )}{" "}
                  {busy
                    ? "正在斟酌措辞…"
                    : input.mode === "sample"
                      ? "查看三条示例"
                      : "生成三条候选文案"}
                  <ArrowRight size={18} />
                </button>
                <p>
                  {input.mode === "sample"
                    ? "示例按场景与匹配的预设背景展示固定文案，不由模型生成。"
                    : "使用服务器配置的模型。填写的信息将发送至模型服务。"}
                </p>
              </div>
            </section>
            <section
              className="output-panel"
              ref={outputRef}
              aria-label="候选文案"
              aria-busy={busy}
            >
              <div className="output-header">
                <div>
                  <p className="eyebrow">CRAFTED FOR YOUR CONVERSATION</p>
                  <h2>
                    候选文案 <span>03</span>
                  </h2>
                </div>
                <button
                  title="导出本次结果"
                  aria-label="导出本次结果"
                  className="icon-button"
                  onClick={download}
                  disabled={!result}
                >
                  <ArrowDownToLine size={18} />
                </button>
              </div>
              <div className="scenario-caption">
                <span className="small-line" />
                <span>{scenario.en}</span>
              </div>
              {error && (
                <div role="alert" className="error-box">
                  {error}
                </div>
              )}
              {result ? (
                <div className="results">
                  <div
                    className={`result-note ${result.disposition === "abstain" ? "abstain" : ""}`}
                  >
                    <ShieldCheck size={15} />
                    {result.disposition === "abstain"
                      ? "客户拒绝联系 · 以下为内部提示，请勿发送"
                      : result.mode === "sample"
                        ? "固定示例 · 按场景和预设背景展示"
                        : "AI 生成 · 请逐条核对事实"}
                  </div>
                  {result.messages.map((m, i) => (
                    <article className="message-card" key={i}>
                      <div className="card-top">
                        <span>
                          <b>0{i + 1}</b>
                          {["简洁问候", "贴近语境", "温和延续"][i]}
                        </span>
                        <small>{m.length} 字符</small>
                      </div>
                      <p>{m}</p>
                      <div className="card-bottom">
                        <span>
                          {result.disposition === "abstain"
                            ? "内部提示"
                            : result.mode === "sample"
                              ? "CURATED EXAMPLE"
                              : "AI DRAFT"}
                        </span>
                        <button
                          disabled={result.disposition === "abstain"}
                          onClick={() => copy(m, i)}
                        >
                          {copied === i ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}{" "}
                          {copied === i ? "已复制" : "复制文案"}
                        </button>
                      </div>
                    </article>
                  ))}
                  <div className="result-meta">
                    <Check size={13} />
                    基础格式检查通过 · {result.model || "固定场景示例"} · v
                    {result.version}
                  </div>
                  <button
                    className="regenerate"
                    onClick={generate}
                    disabled={busy}
                  >
                    <RotateCcw size={14} />
                    {input.mode === "sample" ? "重新查看示例" : "重新生成"}
                  </button>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-art">
                    <div className="orbit" />
                    <Feather size={40} strokeWidth={1} />
                    <span className="art-dot" />
                  </div>
                  <p className="eyebrow">
                    A LITTLE CONTEXT. A BETTER CONVERSATION.
                  </p>
                  <h3>
                    {busy ? "让心意，慢慢成句。" : "好的表达，从倾听开始。"}
                  </h3>
                  <p>
                    {busy
                      ? "正在根据沟通背景整理三种表达，请稍候。"
                      : "在左侧补充沟通背景，选择一种生成方式。"}
                    <br />
                    {busy ? "" : "让每句话，都有真实的依据与恰当的温度。"}
                  </p>
                  <div className="empty-steps">
                    <span>01 了解客户</span>
                    <i />
                    <span>02 斟酌表达</span>
                    <i />
                    <span>03 顾问确认</span>
                  </div>
                </div>
              )}
              <div className="review-note">
                <ShieldCheck size={17} />
                <div>
                  <strong>心意由 AI 辅助，分寸由您把握。</strong>
                  <p>
                    发送前请核对称呼、产品事实与客户联系偏好。所有文案仅为草稿。
                  </p>
                </div>
              </div>
            </section>
          </div>
          <footer>
            <span>
              客户顾问沟通助手 <i /> 为长久的关系，留白。
            </span>
            <span>虚构品牌与人物 · 不会自动发送消息</span>
          </footer>
        </div>
      </main>
      <dialog
        ref={guideRef}
        aria-labelledby="guide-title"
        className="modal"
        onCancel={() => setGuide(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setGuide(false);
        }}
      >
        <button
          className="modal-close icon-button"
          aria-label="关闭说明"
          onClick={() => setGuide(false)}
        >
          <X size={20} />
        </button>
        <p className="eyebrow">ABOUT THIS WORKSPACE</p>
        <h2 id="guide-title">为关系而写，为顾问而做。</h2>
        <p>
          选择六种场景之一，补充虚构背景，查看三条中文微信草稿。点击复制后，请在发送前自行修改和确认。
        </p>
        <h3>两种工作方式</h3>
        <p>
          <strong>示例模式：</strong>
          无需密钥，展示预先编写的场景文案。推荐、邀约、价格异议及久别问候提供虚构背景；修改背景后会退回通用示例，避免引用不匹配的历史事实。
        </p>
        <p>
          <strong>AI 实时生成：</strong>
          {publicDemoOnly
            ? "公开Demo仅提供固定示例。实时AI功能可在本地版本中运行，真实测试输出见仓库中的评估材料。"
            : "在 .env.local 配置 OPENAI_API_KEY 与 OPENAI_MODEL 后重启服务器。没有配置时会提示错误，不会回退到示例。"}
        </p>
        <h3>您的数据</h3>
        <p>
          {publicDemoOnly ? "此公开Demo不调用模型，输入仅用于处理固定示例，不建立客户数据库。" : "本地应用不保存客户资料。实时模式会将输入发送给模型服务。"}导出按钮仅下载当前输入与结果到您的设备。请只使用虚构数据。
        </p>
        <button className="generate" onClick={() => setGuide(false)}>
          开始使用
          <ArrowRight size={16} />
        </button>
      </dialog>
    </div>
  );
}
