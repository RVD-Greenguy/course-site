import CodeBlock from "../components/CodeBlock";
import DashboardTabs from "../components/DashboardTabs";
import StatRow from "../components/StatRow";
import RealWorldExample from "../components/RealWorldExample";
import ScalingLawSandbox from "../sandboxes/ScalingLawSandbox";
import PretrainLossSandbox from "../sandboxes/PretrainLossSandbox";
import ToolBuildingSandbox from "../sandboxes/ToolBuildingSandbox";
import ToolUseLoopSandbox from "../sandboxes/ToolUseLoopSandbox";
import RoutingSandbox from "../sandboxes/RoutingSandbox";
import WorkflowPatternSandbox from "../sandboxes/WorkflowPatternSandbox";
import CartPoleSandbox from "../sandboxes/CartPoleSandbox";
import Evidence from "../components/Evidence";
import ResourceList from "../components/ResourceList";
import {
  toolBuildingCode, statefulToolCode, codeAgentVsToolCallingAgent,
  travelAgentMcpCode, planningHitlCode, cartPoleCode, memoryResetNote,
  contextEngineeringTechniques, agentComponents, day4Resources,
} from "../data/day4";

export default function Day4() {
  return (
    <div>
      <h1>Day 4 — Pre-training & Agentic AI</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Module 4.1: pre-training vs fine-tuning. Module 4.2: Agentic AI with{" "}
        <strong>smolagents</strong> — building custom tools, CodeAgent vs ToolCallingAgent,
        planning with human-in-the-loop review, MCP-based agents, and a reinforcement-learning
        case study (CartPole Q-learning). Code sourced from{" "}
        <code>ellm-2026-oct12/day04</code> (<code>chuk_day04-tools-blank.ipynb</code>,{" "}
        <code>chuk_day04-agents-v2.0-blank.ipynb</code>, <code>travelagent.py</code>,{" "}
        <code>cli_travelagent.py</code>, <code>cart_pole_qlearning.py</code>).
      </p>

      <StatRow
        stats={[
          { label: "SEA-LION pretrain tokens", value: "200B" },
          { label: "Chinchilla D/N ratio", value: "~20x" },
          { label: "Agent base class", value: "MultiStepAgent" },
          { label: "RL state dims", value: "4 (continuous)" },
        ]}
      />

      <h2>Pre-training vs fine-tuning</h2>
      <p>
        Pre-training builds a model's general language ability from massive unlabeled corpora;
        fine-tuning (e.g. Day 2's LoRA workshop) specializes an already pre-trained model on a
        narrower task.
      </p>
      <Evidence
        kind="course"
        source="Day 4 slides, p.10 — SEA-LION v3 case study"
        note="SEA-LION v3 8B/70B (AI Singapore, built on Llama 3.1): continued pre-trained on 200 billion tokens of SEA-language data (Thai, Vietnamese, Tamil, Indonesian), then instruction-tuned on 9.5M English + 7.3M multilingual prompts. Training took ~136 GPU-hours (8B) / ~495 GPU-hours (70B) on Nvidia H100/H200, bfloat16 precision, 128K context length."
      />
      <Evidence
        kind="external"
        source="Hoffmann et al. 2022 — not in Day 4 slides"
        note="The Day 4 deck has NO loss function, scaling-law equation, or FLOPs formula anywhere. The two calculators below supply the actual math: what pre-training optimizes token-by-token, and how model size vs. data size trade off at a fixed compute budget."
      />

      <h2>Agentic AI dashboard</h2>
      <DashboardTabs
        defaultTab="pretrain"
        tabs={[
          {
            id: "pretrain",
            label: "Pre-training math",
            badge: "interactive",
            content: (
              <>
                <PretrainLossSandbox />
                <ScalingLawSandbox />
                <RealWorldExample
                  title="scaling-law decisions real labs make"
                  scenarios={[
                    {
                      label: "SEA-LION's choice",
                      scenario: "AI Singapore wants a strong Southeast-Asian-language model but has a fixed compute budget, not an open-ended one.",
                      outcome: "Rather than training a huge model from scratch, they continue-pretrain Llama 3.1 (already strong in English) on 200B tokens of SEA-language data — spending the budget on data for an underserved language family instead of raw parameter count.",
                    },
                    {
                      label: "GPT-3's mistake, Chinchilla's fix",
                      scenario: "GPT-3 (175B params, 300B tokens, D/N≈1.7x) and Chinchilla (70B params, 1.4T tokens, D/N≈20x) spent roughly the same total compute.",
                      outcome: "Chinchilla — the smaller, more-data-trained model — beat GPT-3 on benchmarks, because GPT-3 over-invested in parameters relative to data. This is the real-world reason \"bigger model\" stopped being the default answer after 2022.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "concepts",
            label: "Agent concepts",
            content: (
              <>
                <h4 style={{ marginTop: 0 }}>What is an AI Agent?</h4>
                <table className="table">
                  <thead><tr><th>Component</th><th>Role</th></tr></thead>
                  <tbody>
                    {agentComponents.map((c) => (
                      <tr key={c.name}><td><code>{c.name}</code></td><td>{c.desc}</td></tr>
                    ))}
                  </tbody>
                </table>
                <h4>Context Engineering</h4>
                <table className="table">
                  <thead><tr><th>Technique</th><th>Description</th></tr></thead>
                  <tbody>
                    {contextEngineeringTechniques.map((t) => (
                      <tr key={t.name}><td><code>{t.name}</code></td><td>{t.desc}</td></tr>
                    ))}
                  </tbody>
                </table>
                <RealWorldExample
                  title="agent vs plain chatbot, in production"
                  scenarios={[
                    {
                      label: "Travel booking",
                      scenario: "A user says \"book me a flight to Tokyo next Friday under $800 and a hotel near Shibuya.\"",
                      outcome: "A plain chatbot can only describe what you'd need to do. An agent with flight-search and hotel-search tools (this page's MCP travel agent) actually calls those APIs, compares results, and executes the booking — the difference between advice and action.",
                    },
                    {
                      label: "Why context engineering matters",
                      scenario: "A coding agent working on a large repo accumulates 50 tool-call results (file reads, test outputs) across a long session — far more than fits in context.",
                      outcome: "Compress (summarize old results) and Isolate (give sub-agents their own clean context for sub-tasks) keep the agent from either running out of context or getting confused by stale information — this is a daily operational problem for agent frameworks, not a theoretical one.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "tooluse",
            label: "Tool-use loop",
            badge: "interactive",
            content: (
              <>
                <p>
                  <code>@tool</code> turns a type-hinted Python function into a tool the LLM can
                  call — the docstring's Args/Returns sections become the schema, no manual JSON
                  schema needed:
                </p>
                <CodeBlock code={toolBuildingCode} title="chuk_day04-tools-blank.ipynb — @tool functions" />
                <ToolBuildingSandbox />
                <p>Stateful tools (holding a DB connection, a lock) subclass <code>Tool</code> instead:</p>
                <CodeBlock code={statefulToolCode} title="chuk_day04-tools-blank.ipynb — SQLiteTool(Tool)" />
                <ToolUseLoopSandbox />
                <RealWorldExample
                  title="deciding when to call a tool"
                  scenarios={[
                    {
                      label: "Stock price question",
                      scenario: '"What\'s Nvidia\'s stock price right now?" — a fact that changes every minute and definitely isn\'t in the model\'s training data.',
                      outcome: "The model recognizes it can't know this and calls a stock-price tool — same tool_use → execute → tool_result loop as the Wikipedia example in the sandbox above.",
                    },
                    {
                      label: "Arithmetic question",
                      scenario: '"What is 847 × 23?" — technically answerable by a calculator tool, but also just... math.',
                      outcome: 'A well-prompted agent answers directly (end_turn) instead of wasting a tool round-trip — calling a tool for everything, even when unnecessary, is a common and costly agent design mistake (extra latency, extra cost, more failure points).',
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "codevtool",
            label: "CodeAgent vs ToolCalling",
            content: (
              <>
                <p>
                  Both inherit the same <code>MultiStepAgent</code> base (ReAct loop,{" "}
                  <code>max_steps</code>, memory, planning, step callbacks) — they differ in how
                  the agent takes action each step:
                </p>
                <table className="table">
                  <thead><tr><th>Aspect</th><th>CodeAgent</th><th>ToolCallingAgent</th></tr></thead>
                  <tbody>
                    {codeAgentVsToolCallingAgent.map((r) => (
                      <tr key={r.aspect}>
                        <td>{r.aspect}</td>
                        <td style={{ fontSize: 12 }}>{r.codeAgent}</td>
                        <td style={{ fontSize: 12 }}>{r.toolCalling}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>{memoryResetNote}</p>
                <RealWorldExample
                  title="picking the right agent type"
                  scenarios={[
                    {
                      label: "Data analysis agent",
                      scenario: 'An agent needs to "find the 3 products with the biggest month-over-month sales drop" from a CSV with 50,000 rows.',
                      outcome: "CodeAgent — writing and running a pandas filter/groupby is far more reliable (and auditable) than a ToolCallingAgent chaining dozens of individual fixed-schema tool calls to approximate the same computation.",
                    },
                    {
                      label: "Customer-facing booking agent",
                      scenario: "An agent exposed to end users needs to call exactly 2 vetted, rate-limited APIs (flight search, hotel search) and nothing else.",
                      outcome: "ToolCallingAgent — a fixed, auditable set of tool calls is safer here than letting the agent write arbitrary code; you can log and rate-limit every call because the action space is a known schema, not free-form code.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "routing",
            label: "Routing & patterns",
            badge: "interactive",
            content: (
              <>
                <RoutingSandbox />
                <WorkflowPatternSandbox />
                <RealWorldExample
                  title="routing and workflows in real systems"
                  scenarios={[
                    {
                      label: "Tiered support routing",
                      scenario: '"My password reset email never arrived" vs "Can you explain the architectural trade-offs of migrating our billing system to microservices?"',
                      outcome: "The first routes to a FastAgent/cheap-model path (simple, well-known fix); the second routes to a DeepThinkingAgent/expensive-model path — the same classify-then-route pattern as the sandbox, applied to cost control instead of just latency.",
                    },
                    {
                      label: "Content moderation pipeline",
                      scenario: "A platform needs every uploaded post checked for policy violations across text, images, and spam patterns simultaneously, fast.",
                      outcome: "Parallelization (Sectioning) — run text-toxicity, image-safety, and spam-detection checks concurrently, then aggregate — much faster than a single sequential chain checking one thing at a time.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "planning",
            label: "Planning & HITL",
            content: (
              <>
                <p>
                  With <code>planning_interval</code> set, the agent periodically produces a{" "}
                  <code>PlanningStep</code>. A <code>step_callbacks</code> hook can intercept it so
                  a human approves, edits, or cancels the plan before the agent acts on it:
                </p>
                <CodeBlock code={planningHitlCode} title="cli_travelagent.py — review_plan + planning_interval" />
                <RealWorldExample
                  title="why human-in-the-loop isn't optional for some agents"
                  scenarios={[
                    {
                      label: "Financial transaction agent",
                      scenario: 'An agent plans "transfer $5,000 from savings to checking, then pay 3 vendor invoices" — real money movement.',
                      outcome: "planning_interval surfaces this plan for a human to approve before any transfer executes — catching a misread invoice amount or wrong account before money actually moves, not after.",
                    },
                    {
                      label: "Low-stakes research agent",
                      scenario: 'An agent plans "search 3 sources and summarize recent papers on X" — read-only, reversible, no side effects.',
                      outcome: "No HITL gate needed — the cost of a wrong step is just a wasted search, so human review would only add latency without reducing real risk. HITL is a dial, not a universal requirement.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "mcp",
            label: "MCP agent",
            content: (
              <>
                <p>
                  <code>ToolCallingAgent</code> wired to two independent MCP servers (Airbnb
                  search, flight search), each launched as a stdio subprocess — the agent never
                  needs a custom integration for either:
                </p>
                <CodeBlock code={travelAgentMcpCode} title="travelagent.py — MCP + ToolCallingAgent + GradioUI" />
                <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
                  <strong>Model Context Protocol (MCP)</strong> is an open standard for connecting
                  agents to external tools/data sources in a model-agnostic way — a tool
                  integration (like the Airbnb server above) is built once and reused across any
                  MCP-supporting agent framework.
                </p>
                <RealWorldExample
                  title="MCP solving a real integration headache"
                  scenarios={[
                    {
                      label: "Before MCP",
                      scenario: "A company builds 5 different agents (support bot, sales assistant, internal ops agent, ...), and each one needs its own custom integration code for Slack, their CRM, and their ticketing system — 15 integrations to write and maintain.",
                      outcome: "N agents × M tools = N×M custom integrations, and every tool API change breaks multiple integrations independently.",
                    },
                    {
                      label: "With MCP",
                      scenario: "The same 5 agents, but Slack/CRM/ticketing each ship one MCP server.",
                      outcome: "N agents × M tools = N+M total integration points — any MCP-compatible agent framework can use any MCP server unmodified, same as the travel agent above plugging into independently-built Airbnb and flight-search servers.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "rl",
            label: "RL: CartPole",
            badge: "interactive",
            content: (
              <>
                <p>
                  A different kind of agent: no LLM at all. The agent learns a policy purely from
                  trial and error, approximating <code>Q(s,a)</code> as a linear function of a
                  continuous 4D state since a tabular Q-table can't index continuous values:
                </p>
                <CodeBlock code={cartPoleCode} title="cart_pole_qlearning.py — linear Q-learning" />
                <CartPoleSandbox />
                <RealWorldExample
                  title="RL beyond the simulator"
                  scenarios={[
                    {
                      label: "Data center cooling",
                      scenario: "Google DeepMind needed to control cooling systems in data centers to minimize energy use without letting any server overheat — too complex to hand-tune with fixed rules.",
                      outcome: "An RL agent learns a cooling policy from trial-and-error against a simulated/real environment (state = temperatures/loads, action = cooling adjustments, reward = energy saved minus overheating risk) — reportedly cut cooling energy use by ~40%, the exact same reward-driven policy-learning loop as the CartPole sandbox, just a much bigger state space.",
                    },
                    {
                      label: "RLHF — training the chat model itself",
                      scenario: "How do GPT-OSS/Qwen (the models this site's search bar calls) get tuned to prefer helpful, non-harmful responses after pre-training?",
                      outcome: "Reinforcement Learning from Human Feedback: human preference ratings train a reward model, then the LLM is updated via policy gradient (PPO) to maximize that reward — same Q-learning-family idea (state, action, reward, policy update) as CartPole, with \"state\" being a conversation and \"action\" being the next token distribution.",
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <h2>This is what powers the search bar →</h2>
      <p>
        The search bar on top of every page runs the exact pattern taught above: a guardrail
        check (deterministic, keyword-based — not left to the LLM to self-police) gates every
        message against this site's own topics first — Day 1-4, the Group Project, Model Training
        Evaluation, Cheatsheet — and rejects anything outside that scope before any model call.
        An in-scope message is then sent to a small free model (Groq) with a <code>web_search</code>{" "}
        tool it can use only to support an in-scope answer (e.g. a current benchmark number); if it
        asks to search, the server executes the search and feeds the result back before the final
        answer — the same detect-tool-call → execute → return-result loop as{" "}
        <code>ToolCallingAgent</code> above, just hand-rolled in Node instead of smolagents.
      </p>

      <h2>Resources</h2>
      <ResourceList resources={day4Resources} />
    </div>
  );
}
