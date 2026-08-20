"use client";

import { useMemo, useState, type FormEvent } from "react";
import type { WorkItem } from "@/lib/types";
import type { ViewProps } from "./views";
import { EmptyState, PageHeading, RecordCard, SectionHeading } from "./ui";

const TOOL_TABS = [
  "Social Prompt Studio",
  "Job Scope Builder",
  "Profitability",
  "Client Communication",
  "Monthly Close Starter",
  "Field Notes Converter",
  "Capacity Planner",
  "Saved Results",
];

function field(form: FormData, name: string, fallback = "NOT PROVIDED") {
  return String(form.get(name) ?? "").trim() || fallback;
}

function SocialStudio({ props }: { props: ViewProps }) {
  const [result, setResult] = useState("");
  const [title, setTitle] = useState("");
  const generate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const idea = field(data, "idea");
    const platform = field(data, "platform", "Instagram Reel");
    const format = field(data, "format", "Short-form video");
    const goal = field(data, "goal", "Showcase the practical value of Devoted Landscaping's work");
    const audience = field(data, "audience", "Local homeowners and property managers");
    const location = field(data, "location");
    const service = field(data, "service");
    const assets = field(data, "assets");
    const facts = field(data, "facts");
    const tone = field(data, "tone", "Professional, approachable, clever");
    const cta = field(data, "cta", "Invite viewers to contact Devoted Landscaping");
    const deliverables = field(data, "deliverables", "Caption; three hooks; on-screen text; Reel sequence; hashtag set");
    setTitle(idea.slice(0, 110));
    setResult(`You are acting as Devoted Landscaping’s senior social-media strategist, local-service marketer and creative director.

Create content for: ${platform} · ${format}.

Business: Devoted Landscaping LLC
Service area: Hays County, Comal County, Wimberley, Dripping Springs, San Marcos and New Braunfels, Texas.

Objective: ${goal}
Audience: ${audience}
Project/service: ${service}
Location: ${location}
Available assets: ${assets}
Raw idea: ${idea}
Verified facts: ${facts}
Desired tone: ${tone}
Call to action: ${cta}
Length: Concise
Hashtag approach: Relevant local and service tags; avoid spammy tags

Deliverables:
${deliverables}

Requirements:
- Preserve every verified fact.
- Do not invent customer details, measurements, project results, dates or testimonials.
- Treat every NOT PROVIDED field as unknown and say what missing information would materially improve the result.
- Use Devoted’s professional but approachable local brand voice.
- Avoid generic landscaping clichés.
- Lead with a strong hook.
- Make the transformation, human story or practical value clear.
- Use location-specific language only when the location is confirmed.
- Keep hashtags relevant and avoid obviously spammy tags.
- Provide the strongest recommended option first.`);
  };
  const save = async () => {
    if (!result) return;
    await fetch("/api/records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "content_idea",
        title: title || "New content idea",
        body: title,
        status: "Ready",
        workstream: "Social Media and Marketing",
        tags: "social,content,prompt",
        generatedPrompt: result,
      }),
    });
    window.dispatchEvent(new CustomEvent("devoted-refresh"));
  };
  return (
    <div className="tool-split">
      <form className="tool-form" onSubmit={generate}>
        <SectionHeading eyebrow="Idea inputs" title="Preserve facts, label unknowns" />
        <label className="wide">Rough idea<textarea name="idea" required placeholder="Describe the idea exactly as it came to you…" /></label>
        <label>Platform<select name="platform" defaultValue="Instagram Reel"><option>Instagram Reel</option><option>Instagram feed</option><option>Instagram Story</option><option>Facebook</option><option>TikTok</option><option>YouTube Short</option><option>Multi-platform</option></select></label>
        <label>Format<input name="format" defaultValue="Short-form video or Images" /></label>
        <label>Objective<input name="goal" placeholder="What should this content accomplish?" /></label>
        <label>Audience<input name="audience" defaultValue="Local homeowners and property managers" /></label>
        <label>Project / service<input name="service" placeholder="Leave blank if unknown" /></label>
        <label>Location<input name="location" placeholder="Leave blank if unknown" /></label>
        <label className="wide">Available assets<textarea name="assets" placeholder="Photos, video clips, before/after images…" /></label>
        <label className="wide">Verified facts<textarea name="facts" placeholder="Only facts that must be preserved" /></label>
        <label>Tone<input name="tone" defaultValue="Professional, approachable, clever" /></label>
        <label>Call to action<input name="cta" defaultValue="Invite viewers to contact Devoted Landscaping" /></label>
        <label className="wide">Deliverables<input name="deliverables" defaultValue="Caption; three hooks; on-screen text; Reel sequence; hashtag set" /></label>
        <button className="button primary wide" type="submit">Generate complete prompt</button>
      </form>
      <div className="generated-result">
        <SectionHeading eyebrow="Generated prompt" title={result ? "Copy-ready brief" : "Your prompt will appear here"} />
        {result ? <><pre>{result}</pre><div className="button-row"><button className="button primary" onClick={() => props.onCopy(result, "Prompt")}>⧉ Copy prompt</button><button className="button" onClick={save}>Save to master item</button></div></> : <EmptyState title="Start with the rough idea" text="Unknown fields will remain visibly unknown; nothing will be invented." />}
      </div>
    </div>
  );
}

function PromptBuilder({
  eyebrow,
  title,
  description,
  placeholder,
  build,
  props,
}: {
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  build: (notes: string) => string;
  props: ViewProps;
}) {
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState("");
  const save = async () => {
    if (!result) return;
    await fetch("/api/records", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "generated_prompt", title, body: result, status: "Ready", workstream: "Systems and SOPs", tags: "prompt,tool" }) });
    window.dispatchEvent(new CustomEvent("devoted-refresh"));
  };
  return <div className="tool-split"><div className="tool-form single"><SectionHeading eyebrow={eyebrow} title={title} /><p>{description}</p><label className="wide">Rough information<textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={placeholder} /></label><button className="button primary wide" onClick={() => setResult(build(notes || "NOT PROVIDED"))}>Build prompt</button></div><div className="generated-result"><SectionHeading eyebrow="Generated result" title={result ? "Ready to use" : "Waiting for notes"} />{result ? <><pre>{result}</pre><div className="button-row"><button className="button primary" onClick={() => props.onCopy(result, "Prompt")}>Copy prompt</button><button className="button" onClick={save}>Save result</button></div></> : <EmptyState title="Paste the rough version" text="The builder will organize it without inventing facts." />}</div></div>;
}

function ProfitabilityTool() {
  const [inputs, setInputs] = useState({ leadRate: 26, leadHours: 8, experiencedRate: 22, experiencedHours: 8, memberRate: 18, memberHours: 8, burden: 18, materials: 2500, equipment: 500, subcontractors: 0, disposal: 300, travel: 100, contingency: 12, salesPrice: 10000, targetMargin: 50 });
  const update = (key: keyof typeof inputs, value: string) => setInputs((current) => ({ ...current, [key]: Number(value) || 0 }));
  const result = useMemo(() => {
    const rawLabor = inputs.leadRate * inputs.leadHours + inputs.experiencedRate * inputs.experiencedHours + inputs.memberRate * inputs.memberHours;
    const burdenedLabor = rawLabor * (1 + inputs.burden / 100);
    const base = burdenedLabor + inputs.materials + inputs.equipment + inputs.subcontractors + inputs.disposal + inputs.travel;
    const contingency = base * inputs.contingency / 100;
    const direct = base + contingency;
    const profit = inputs.salesPrice - direct;
    const margin = inputs.salesPrice ? profit / inputs.salesPrice * 100 : 0;
    const required = inputs.targetMargin >= 100 ? 0 : direct / (1 - inputs.targetMargin / 100);
    return { rawLabor, burdenedLabor, contingency, direct, profit, margin, required };
  }, [inputs]);
  const money = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
  return <div className="profitability-layout"><div className="tool-form"><SectionHeading eyebrow="Planning inputs" title="Project assumptions" />{Object.entries(inputs).map(([key, value]) => <label key={key}>{key.replace(/([A-Z])/g, " $1").replace(/^./, (match) => match.toUpperCase())}<input type="number" step="0.01" value={value} onChange={(event) => update(key as keyof typeof inputs, event.target.value)} /></label>)}</div><div className="profit-results"><SectionHeading eyebrow="Planning estimate" title="Profitability snapshot" /><div><span>Raw labor</span><strong>{money(result.rawLabor)}</strong></div><div><span>Burdened labor</span><strong>{money(result.burdenedLabor)}</strong></div><div><span>Contingency</span><strong>{money(result.contingency)}</strong></div><div className="emphasis"><span>Estimated direct cost</span><strong>{money(result.direct)}</strong></div><div><span>Estimated gross profit</span><strong className={result.profit >= 0 ? "positive" : "negative"}>{money(result.profit)}</strong></div><div><span>Estimated margin</span><strong>{result.margin.toFixed(1)}%</strong></div><div className="orange"><span>Price for {inputs.targetMargin}% margin</span><strong>{money(result.required)}</strong></div><p>Planning estimate only. Confirm actual labor, materials, equipment, tax, and scope assumptions before quoting.</p></div></div>;
}

function CapacityPlanner({ items, onOpen }: { items: WorkItem[]; onOpen: (item: WorkItem) => void }) {
  const active = items.filter((item) => !item.archivedAt && !item.completedAt && item.status !== "Completed" && item.primaryActionId);
  const total = active.reduce((sum, item) => sum + (item.effortMinutes ?? 30), 0);
  const ranked = [...active].sort((a, b) => (b.priority === "High" ? 2 : 0) + (b.impact === "High" ? 2 : 0) - ((a.priority === "High" ? 2 : 0) + (a.impact === "High" ? 2 : 0))).slice(0, 8);
  return <div><div className="capacity-summary"><div><span>{active.length}</span><strong>Open master items</strong></div><div><span>{Math.round(total / 60)}h</span><strong>Recorded / assumed effort</strong></div><div><span>{active.filter((item) => item.waitingOn).length}</span><strong>Waiting on someone</strong></div></div><section className="panel"><SectionHeading eyebrow="Recommended queue" title="Work in this order" />{ranked.map((item, index) => <button className="capacity-row" key={item.id} onClick={() => onOpen(item)}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><small>{item.dueDate ? `Due ${item.dueDate}` : item.waitingOn ? `Waiting on ${item.waitingOn}` : `${item.effortMinutes ?? 30} min assumed`}</small><b>→</b></button>)}</section></div>;
}

export function ToolsView(props: ViewProps) {
  const [tab, setTab] = useState(TOOL_TABS[0]);
  const saved = props.items.filter((item) => item.kind === "generated_prompt" || item.generatedPrompt);
  return (
    <>
      <PageHeading eyebrow="Working tools" title="Turn rough inputs into usable work" description="Prompt builders, planning calculators, close starters, and workload tools built around Devoted’s real operating workflow." />
      <div className="tool-tabs">{TOOL_TABS.map((value) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}>{value}</button>)}</div>
      <section className="tool-stage">
        {tab === "Social Prompt Studio" ? <SocialStudio props={props} /> : null}
        {tab === "Job Scope Builder" ? <PromptBuilder eyebrow="Estimate preparation" title="Job Scope and Estimate Prompt" description="Convert field notes into a complete scope-development brief." placeholder="Paste site notes, measurements, materials, constraints, and unknowns…" props={props} build={(notes) => `Act as Devoted Landscaping's senior estimator, project manager, and field-operations planner.\n\nUse the rough field notes below to build: scope of work; assumptions; exclusions; labor plan; materials; equipment; risks; contingency; pricing review; customer-facing proposal language; crew packet; HomeWorks job notes; change-order triggers; photo plan; closeout checklist; and post-job profitability review.\n\nROUGH FIELD NOTES\n${notes}\n\nDo not invent measurements, customer promises, prices, dates, or site conditions. Label every material unknown as NOT PROVIDED and state what must be verified before the quote is final.`} /> : null}
        {tab === "Profitability" ? <ProfitabilityTool /> : null}
        {tab === "Client Communication" ? <PromptBuilder eyebrow="Customer communication" title="Client Message Builder" description="Create a response brief that protects commitments and keeps the next step clear." placeholder="Paste the customer's message and your intended outcome…" props={props} build={(notes) => `Act as Devoted Landscaping's client-communication specialist. Draft a polite, calm, professional, firm response using the information below. Acknowledge the concern without implying renegotiation unless explicitly authorized. State the next action, owner, and timing only when known. Do not invent promises, prices, schedule dates, scope, or customer facts.\n\nSOURCE INFORMATION\n${notes}\n\nReturn: recommended subject; strongest response first; shorter text-message version; facts that require verification; and internal follow-up task.`} /> : null}
        {tab === "Monthly Close Starter" ? <PromptBuilder eyebrow="D.A.I.S.Y." title="Monthly Close Starter" description="Generate the collection and reconciliation brief for a specific month." placeholder="Enter month/year plus any known missing sources or exceptions…" props={props} build={(notes) => `You are the Devoted Landscaping Management P&L Controller. Start a month-specific D.A.I.S.Y. close using the details below.\n\nMONTH / CURRENT STATE\n${notes}\n\nCreate a collection checklist covering: receipt extractions; credit-card and American Express statements; WEX/Valero fuel records; bank statements; HomeWorks revenue; ADP payroll expenditures and processing fees; debt and loan activity; principal versus interest; sales tax; equipment/fixed assets; vehicle expenses; meals/travel; insurance/prepaids; software; 1099 vendors; CPA questions; unresolved categorization; three-way sales-tax reconciliation; and the final month-close report.\n\nDo not mark any source complete without evidence. Keep missing receipts and disputed methodology visible as exceptions. Do not double-count card payments as operating expenses.`} /> : null}
        {tab === "Field Notes Converter" ? <PromptBuilder eyebrow="Meeting + field notes" title="Structured Operations Brief" description="Turn rough notes into decisions, tasks, owners, and follow-up communication." placeholder="Paste dictated notes, meeting fragments, or field observations…" props={props} build={(notes) => `Turn the following Devoted Landscaping meeting or field notes into a structured operations brief:\n\n${notes}\n\nReturn: concise summary; decisions already made; tasks; owners; due dates; waiting-on items; risks; unanswered questions; copy-ready HomeWorks notes; and a follow-up message. Do not invent owners, dates, commitments, measurements, customer facts, or decisions. Label missing information as NOT RECORDED.`} /> : null}
        {tab === "Capacity Planner" ? <CapacityPlanner items={props.items} onOpen={props.onOpen} /> : null}
        {tab === "Saved Results" ? <div className="prompt-card-grid">{saved.map((item) => <RecordCard key={item.id} item={item} onOpen={props.onOpen}><button className="button" onClick={() => props.onCopy(item.generatedPrompt ?? item.body, "Prompt")}>Copy prompt</button></RecordCard>)}</div> : null}
      </section>
    </>
  );
}

