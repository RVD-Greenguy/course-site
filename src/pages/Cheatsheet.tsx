export default function Cheatsheet() {
  return (
    <div>
      <h1>Cheatsheet</h1>

      <h2>Day 1 — Generation & Multimodal</h2>
      <table className="table">
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>temperature</code></td><td>Randomness of token sampling; higher = more diverse</td></tr>
          <tr><td><code>top_p</code></td><td>Nucleus sampling cutoff by cumulative probability</td></tr>
          <tr><td><code>top_k</code></td><td>Restrict sampling to top-k most likely tokens</td></tr>
          <tr><td><code>do_sample</code></td><td>False = greedy/beam decoding (ignores temp/top_p/top_k)</td></tr>
          <tr><td><code>apply_chat_template</code></td><td>Formats messages into the model's expected token format</td></tr>
          <tr><td><code>image_grid_thw</code></td><td>Time/Height/Width patch layout for vision inputs</td></tr>
        </tbody>
      </table>

      <h2>Day 1 — Hugging Face model selection & VRAM</h2>
      <table className="table">
        <thead><tr><th>Rule of thumb</th><th>Formula</th></tr></thead>
        <tbody>
          <tr><td>Inference memory</td><td>params × bytes_per_param × ~1.2 (activation overhead)</td></tr>
          <tr><td>Full fine-tune memory (Adam)</td><td>params × 16 bytes (fp16/bf16 weights + grads + fp32 master + fp32 Adam m/v)</td></tr>
          <tr><td>LoRA fine-tune memory</td><td>frozen base at inference cost + (~0.5% of params) × 16 bytes for the adapter</td></tr>
          <tr><td>FP32 / BF16-FP16 / INT8 / INT4</td><td>4 / 2 / 1 / 0.5 bytes per parameter</td></tr>
          <tr><td>Model selection checklist</td><td>task fit (seq2seq vs causal vs vision-language) → licence/gating → base vs instruct variant → fits your GPU? → full FT vs LoRA vs prompting</td></tr>
        </tbody>
      </table>

      <h2>Day 2 — LoraConfig</h2>
      <table className="table">
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>r</code></td><td>Rank of the low-rank update matrices (workshop used 16)</td></tr>
          <tr><td><code>lora_alpha</code></td><td>Scaling factor for merging base vs adapted weights</td></tr>
          <tr><td><code>target_modules</code></td><td>Which layers get adapters (workshop: <code>["q","v"]</code>)</td></tr>
          <tr><td><code>lora_dropout</code></td><td>Dropout applied to adapter layers during training</td></tr>
          <tr><td><code>task_type</code></td><td>e.g. <code>SEQ_2_SEQ_LM</code> for encoder-decoder models</td></tr>
        </tbody>
      </table>

      <h2>Day 3 — RAG</h2>
      <table className="table">
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>chunk_size</code></td><td>Max characters per chunk</td></tr>
          <tr><td><code>chunk_overlap</code></td><td>Characters shared between consecutive chunks</td></tr>
          <tr><td>Bi-encoder</td><td>Embeds query & docs independently — fast, used for initial retrieval</td></tr>
          <tr><td>Cross-encoder</td><td>Embeds query+doc together — slow, accurate, used for reranking</td></tr>
        </tbody>
      </table>

      <h2>Day 3 — Databases: SQL vs Vector DB</h2>
      <table className="table">
        <thead><tr><th>Field</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>SQL (Postgres)</td><td>Structured rows, exact filters/joins/aggregates (e.g. "all songs by artist X")</td></tr>
          <tr><td>Vector DB (ChromaDB)</td><td>Embedding vectors + metadata, similarity search (e.g. "songs that sound like this")</td></tr>
          <tr><td>B-tree / hash index</td><td>SQL's index type — exact equality & range lookups</td></tr>
          <tr><td>HNSW / IVFFlat</td><td>Vector DB's ANN (Approximate Nearest Neighbor) index type — fast similarity search at scale</td></tr>
          <tr><td><code>cosine distance</code></td><td>1 − cosine similarity; what ANN indexes rank candidates by</td></tr>
          <tr><td>pgvector</td><td>Postgres extension adding a <code>VECTOR</code> column + <code>&lt;=&gt;</code> operator — one DB, both query types</td></tr>
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: "var(--text-dim)" }}>
        See the <strong>Databases</strong> tab on the <a href="/day/3">Day 3</a> page for an
        interactive song-recommendation demo of this exact SQL-vs-vector distinction.
      </p>

      <h2>Day 4 — Agent patterns</h2>
      <table className="table">
        <thead><tr><th>Pattern</th><th>Source</th></tr></thead>
        <tbody>
          <tr><td>Prompt Chaining, Routing, Parallelization, Orchestrator-Workers, Evaluator-Optimizer</td><td>Anthropic — Building Effective Agents</td></tr>
          <tr><td>Reflection, Tool Use, Planning, Multi-Agent Collaboration</td><td>Andrew Ng — Agentic design patterns</td></tr>
          <tr><td>Write, Select, Compress, Isolate</td><td>LangChain — Context Engineering</td></tr>
          <tr><td><code>tool_use</code> / <code>tool_result</code></td><td>Anthropic tool-use message blocks</td></tr>
        </tbody>
      </table>
    </div>
  );
}
