export const toolBuildingCode = `from smolagents import tool
import pandas as pd, requests

df = pd.read_csv("cities_latlng.csv")

@tool
def get_latlng(city: str) -> any:
  """
  Get the latitude, longitude and altitude of a city.

  Args:
    city: The name of the city.

  Returns:
    A dictionary containing the latitude, longitude and altitude of the city.

  Example:
    get_latlng('tokyo')
  """
  r = df.query(f"city.str.lower() == '{city.lower()}'")
  return { 'city': city, 'latitude': r.iloc[0]['latitude'], 'longitude': r.iloc[0]['longitude'], 'altitude': r.iloc[0]['altitude'] }

@tool
def get_temperature(latitude: float, longitude: float) -> any:
  """
  Get the temperature at the given latitude and longitude.

  Args:
    latitude: The latitude of the location.
    longitude: The longitude of the location.

  Returns:
    A dictionary containing the temperature and the unit of the temperature.

  Example:
    get_temperature(35.6895, 139.6917)
  """
  url = f"https://api.open-meteo.com/v1/forecast?latitude={latitude}&longitude={longitude}&current=temperature_2m"
  resp = requests.get(url)
  j = resp.json()
  if resp.status_code >= 400:
     raise Exception(j['reason'])
  temperature = j['current']['temperature_2m']
  units = j['current_units']['temperature_2m']
  return { "temperature_unit": units, "temperature": temperature }

# The @tool decorator turns a plain, type-hinted Python function into a
# smolagents Tool — the docstring's Args/Returns sections ARE the schema the
# LLM sees, exactly like Anthropic's input_schema in Day 4's old tool-use
# example, just inferred from the function signature instead of hand-written.`;

export const statefulToolCode = `import sqlite3, threading
from smolagents import Tool

# @tool only works for stateless functions. A tool that needs to hold open
# state across calls (a DB connection, a lock) must instead subclass Tool and
# implement forward() — this is the smolagents equivalent of a class-based
# tool rather than a decorated function.
class SQLiteTool(Tool):
  name = "albums"

  description = """
    Perform SQL queries on the album_track table. Returns the query result as a tuple.
    The table name is album_track and it has the following columns:
      AlbumId: integer
      Title: nvarchar(160)
      track_name: nvarchar(200)
      artist_name: nvarchar(120)
      duration: integer
      composer: nvarchar(220)
    The duration is in milliseconds.
  """

  inputs = {
     "query": {
         "type": "string",
          "description": "A valid SQL query in the SQLite dialect.",
          "required": True
     }
  }

  output_type = "string"

  def __init__(self, db_file):
    self.db_file = db_file
    self.setup()

  def setup(self):
    super().setup()
    self.conn = sqlite3.connect(self.db_file)
    self.lock = threading.Lock()  # one connection shared across tool calls, so guard it

  def forward(self, query: str) -> list:
    try:
      with self.lock:
        cursor = self.conn.cursor()
        rows = cursor.execute(query)
        return rows.fetchall()
    except Exception as e:
      print(f'Query exception: {e}')

db = SQLiteTool("/content/data/chinook_sqlite.sqlite")`;

export const codeAgentVsToolCallingAgent = [
  { aspect: "Action format", codeAgent: "Python code snippet, between <code> and </code> tags", toolCalling: "Structured JSON tool calls via the provider's native function-calling API" },
  { aspect: "How tools appear to the LLM", codeAgent: "As Python functions it can call in code", toolCalling: "As JSON schemas (name, description, parameter types)" },
  { aspect: "Tool calls per step", codeAgent: "Any number, with loops/conditionals/nested calls", toolCalling: "One or more; each result goes back to the LLM before reuse" },
  { aspect: "Parallel tool execution", codeAgent: "Sequential, as the code runs", toolCalling: "Concurrent on a thread pool (max_tool_threads)" },
  { aspect: "State between steps", codeAgent: "Python variables persist across steps", toolCalling: "Only what is in the message history" },
  { aspect: "Computation", codeAgent: "Built in (math, parsing, data transforms)", toolCalling: "Only through tools; add_base_tools=True adds a PythonInterpreterTool" },
  { aspect: "Execution environment", codeAgent: "LocalPythonExecutor (restricted AST interpreter) or a remote sandbox", toolCalling: "Your Python process calls the tools directly" },
  { aspect: "Security controls", codeAgent: "Import allow-list, operation limits, timeout_seconds, sandboxes (docker/e2b/modal/blaxel)", toolCalling: "Limited to what your tools can do" },
  { aspect: "Ending the run", codeAgent: "Calls final_answer(...) from code", toolCalling: "Calls the final_answer tool" },
  { aspect: "Works well with small local models?", codeAgent: "Often not (malformed code blocks)", toolCalling: "Generally better" },
  { aspect: "Best for", codeAgent: "Problem solving, chaining tools, data wrangling, reasoning over intermediate results", toolCalling: "Dispatchers, simple independent API calls, strict validation, environments where code execution isn't allowed" },
];

export const travelAgentMcpCode = `# pip install "flights==0.9.0" "mcp[cli]<2" fastmcp pydantic-settings \\
#             smolagents[mcp] smolagents[openai] ddgs "smolagents[gradio]"
from mcp import StdioServerParameters
from smolagents import GradioUI, MCPClient, ToolCallingAgent, OpenAIServerModel

# Two independent MCP servers, each launched as a local subprocess over
# stdio — Airbnb search (an off-the-shelf npm MCP server) and flight search
# (fli-mcp, built from the "flights" package). Neither tool is hand-written;
# MCP is what lets an agent plug into them without a custom schema per tool.
airbnb_params = StdioServerParameters(command="npx", args=["-y", "@openbnb/mcp-server-airbnb"])
fli_params = StdioServerParameters(command="../.venv/bin/fli-mcp")

airbnb_client = MCPClient(airbnb_params, structured_output=True)
fli_client = MCPClient(fli_params, structured_output=True)

llm_model = OpenAIServerModel(model_id="gpt-5.6-luna", api_key=OPENAI_API_KEY, reasoning_effort="none")

# ToolCallingAgent chosen here (not CodeAgent) — this is exactly the
# "dispatchers, simple independent API calls" case from the comparison table:
# search Airbnb, search flights, no code execution needed.
agent = ToolCallingAgent(
        tools=[*airbnb_client.get_tools(), *fli_client.get_tools()],
        model=llm_model,
        max_tool_threads=2, max_steps=15,
        add_base_tools=True,
        planning_interval=5)

# GradioUI gives the agent a persistent chat web UI for free — reset_agent_memory=False
# keeps conversation state across turns in that UI (see the memory/reset note below).
ui = GradioUI(agent, reset_agent_memory=False)
ui.launch(share=False, server_name="0.0.0.0", server_port=7890)

airbnb_client.disconnect()
fli_client.disconnect()`;

export const planningHitlCode = `from smolagents import FinalAnswerStep, MCPClient, PlanningStep, ToolCallingAgent, OpenAIServerModel

# step_callbacks lets you intercept specific step types mid-run. Here, every
# time the agent produces a PlanningStep (every planning_interval steps), the
# human reviews it BEFORE the agent is allowed to act on it.
def review_plan(step: PlanningStep, agent: ToolCallingAgent) -> None:
    print(f"*** Proposed plan: {step.plan}")
    stop = False
    while not stop:
        choice = input("[A]pprove, [E]dit, [C]ancel: ").strip().lower()
        stop = choice in {"a", "e", "c"}
        if choice == "e":
            print("Write your new plan. Enter a new empty line to end")
            lines = iter(input, "")
            step.plan = "# Updates\\n\\n" + "\\n".join(lines) + step.plan
        elif choice == "c":
            raise Exception("User rejected this plan")  # aborts the run entirely

agent = ToolCallingAgent(
        tools=[*airbnb_client.get_tools(), *fli_client.get_tools()],
        model=llm_model,
        max_tool_threads=2, max_steps=50,
        add_base_tools=True,
        planning_interval=5,
        step_callbacks={PlanningStep: review_plan})

result = agent.run("Plan a 3 day trip to Tokyo, departing Singapore next Sunday, returning the following Saturday.")

# Every PlanningStep and the FinalAnswerStep are retained in agent.memory.steps
# as a full execution trace — this is what lets you print "what did the agent
# actually plan/decide at each stage" after the fact, not just the final text.
for step in agent.memory.steps:
    if isinstance(step, PlanningStep):
        print(f"Plan: {step.plan}\\nTokens: {step.token_usage}")
    elif isinstance(step, FinalAnswerStep):
        print(f"Output: {step.output}")`;

export const cartPoleCode = `import gymnasium as gym
import numpy as np

GAMMA = 0.99     # discount factor for future reward
ALPHA = 0.001    # learning rate
DECAY = 0.002    # epsilon decay rate
MIN_PROB, MAX_PROB = 0.02, 1.0
EPISODES = 2000

env = gym.make('CartPole-v1')

# Linear function approximation instead of a Q-table: the 4D continuous state
# (cart position, cart velocity, pole angle, pole angular velocity) can't be
# tabulated, so Q(s, a) is approximated as a linear function of the state.
weights = np.zeros((4, 2))  # 4 state dims x 2 actions (left, right)
bias = np.zeros(2)

def predict_q_values(st):
    return np.dot(st, weights) + bias

def decay(ep):
    # epsilon starts near 1.0 (mostly random) and decays toward MIN_PROB —
    # explore early, exploit the learned policy later.
    return MIN_PROB + (MAX_PROB - MIN_PROB) * np.exp(-ep * DECAY)

def policy(st, eps):
    if np.random.random() > eps:
        return int(np.argmax(predict_q_values(st)))  # exploit
    return np.random.randint(0, 2)  # explore

for e in range(EPISODES):
    eps = decay(e)
    state, _ = env.reset()
    action = policy(state, eps)
    done = False
    total_reward = 0

    while not done:
        new_state, reward, terminated, truncated, _ = env.step(action)
        done = terminated or truncated
        total_reward += reward

        if done:
            # penalize falling early so the weights steer away from it
            td_target = -1.0 if terminated and total_reward < 500 else reward
        else:
            next_action = policy(new_state, eps)
            td_target = reward + GAMMA * np.amax(predict_q_values(new_state))

        # TD error: how wrong was the current Q estimate for (state, action)?
        current_prediction = predict_q_values(state)[action]
        td_error = td_target - current_prediction

        # Gradient step for a linear model: d/dw Q(s,a) = state, d/db Q(s,a) = 1
        weights[:, action] += ALPHA * td_error * state
        bias[action] += ALPHA * td_error

        if not done:
            action, state = next_action, new_state`;

export const memoryResetNote =
  "The reset parameter controls whether an agent remembers past turns. agent.run() defaults to reset=True — every call starts fresh, with no memory of prior conversation. Passing reset=False makes the next run() see the previous run's full message history, enabling follow-up questions (e.g. \"List primes 0-100\" then, with reset=False, \"What's the sum of all those numbers?\").";

export const contextEngineeringTechniques = [
  { name: "Write", desc: "Persist information outside the immediate context window (scratchpads, memory stores) so it can be retrieved later." },
  { name: "Select", desc: "Pull only the most relevant subset of available context (memory, tools, docs) into the prompt for the current step." },
  { name: "Compress", desc: "Summarize or distill long context (conversation history, retrieved docs) to fit within token budgets." },
  { name: "Isolate", desc: "Partition context across sub-agents or separate windows so unrelated information doesn't interfere with reasoning." },
];

export const agentComponents = [
  { name: "Base LLM", desc: "The underlying reasoning/generation engine driving the agent's decisions." },
  { name: "Tools", desc: "External functions, APIs, or retrieval systems the agent can invoke." },
  { name: "Decision Framework", desc: "Logic for choosing actions — ReAct-style reasoning, planning, or routing." },
  { name: "Memory", desc: "Short-term (conversation) and long-term (persisted) state the agent can draw on." },
  { name: "Goal-oriented behavior", desc: "The agent pursues an objective across multiple steps rather than responding once." },
];

export const day4Resources = [
  {
    title: "smolagents documentation",
    url: "https://huggingface.co/docs/smolagents",
    desc: "HuggingFace's lightweight agent framework — CodeAgent, ToolCallingAgent, @tool, MCPClient, planning.",
    headings: ["CodeAgent", "ToolCallingAgent", "Tools (@tool, Tool class)", "Planning", "Multi-agent", "MCP integration"],
    summary: "smolagents is deliberately minimal: an agent is a short ReAct loop (think → act → observe) around a model and a list of tools, with CodeAgent and ToolCallingAgent as the two concrete action-execution strategies covered in the comparison table below. Both inherit the same MultiStepAgent base — memory, max_steps, planning_interval, and step_callbacks all work identically regardless of which one you pick.",
    howTo: "Default to ToolCallingAgent for small/local models or simple dispatch-style tasks (as in the travel agent below); reach for CodeAgent when the task needs chaining tool outputs through real computation (loops, data wrangling) and you can run it in a sandboxed executor.",
  },
  {
    title: "Model Context Protocol (MCP)",
    url: "https://modelcontextprotocol.io/",
    desc: "Open standard for connecting agents to tools and data sources — used by the travel agent's Airbnb + flights servers.",
    headings: ["What is MCP", "Why MCP matters", "Stdio transport", "Broad ecosystem support"],
    summary: "MCP is \"a USB-C port for AI applications\": a standard protocol so a tool integration is built once (e.g. @openbnb/mcp-server-airbnb) and reused across any MCP-supporting agent framework, instead of being reimplemented per-provider.",
    howTo: "Point smolagents' MCPClient at an MCP server's StdioServerParameters (command + args) to launch it as a subprocess and expose all its tools via client.get_tools() — see travelAgentMcpCode above for the exact pattern used with the Airbnb and flights servers.",
  },
  {
    title: "Open-Meteo API",
    url: "https://open-meteo.com/",
    desc: "Free, keyless, CORS-open weather API — powers the live temperature lookup tool below.",
    headings: ["Current weather", "No API key required", "CORS enabled"],
    summary: "A free weather API with no signup/API key and permissive CORS, which is exactly why it's usable both as a Python tool in the notebooks (get_temperature) and directly from a browser via fetch() in the interactive demo below.",
    howTo: "GET https://api.open-meteo.com/v1/forecast?latitude=...&longitude=...&current=temperature_2m returns current.temperature_2m and current_units.temperature_2m — no auth header needed.",
  },
  {
    title: "Gymnasium — CartPole-v1",
    url: "https://gymnasium.farama.org/environments/classic_control/cart_pole/",
    desc: "The reinforcement-learning environment behind the Q-learning demo below.",
    headings: ["Observation space", "Action space", "Rewards", "Episode termination"],
    summary: "A 4D continuous observation (cart position/velocity, pole angle/angular velocity), 2 discrete actions (push left/right), +1 reward per timestep survived, episode ends when the pole falls past ±12° or the cart leaves the track.",
    howTo: "A tabular Q-table can't index a continuous 4D state — cart_pole_qlearning.py instead approximates Q(s,a) linearly (Q = weights·state + bias) and updates the weights via the TD-error gradient, reproduced in cartPoleCode above and runnable live in CartPoleSandbox.",
  },
  {
    title: "LangChain — Context Engineering",
    url: "https://www.langchain.com/blog/context-engineering-for-agents",
    desc: "Write/Select/Compress/Isolate framework for managing agent context.",
    headings: ["Context Engineering (intro)", "Write Context", "Select Context", "Compress Context", "Isolate Context"],
    summary: "A context window is like RAM — finite, and long-running agents accumulate tokens that cause context poisoning, distraction, confusion, and clash. The 4 strategies: Write (persist outside the window), Select (retrieve only what's relevant), Compress (summarize to fit budget), Isolate (partition across sub-agents).",
    howTo: "Pick one field in your agent's state (e.g. scratchpad: str) and have a tool call append structured notes to it after each meaningful step — treat the live chat context as disposable, reconstructable from the scratchpad.",
  },
];
