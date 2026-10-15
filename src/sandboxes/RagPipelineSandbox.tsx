import AnimatedFlow, { useStepPlayer, type FlowStep } from "../components/AnimatedFlow";

const STEPS: FlowStep[] = [
  { label: "Load", detail: 'UnstructuredEPubLoader("a_christmas_carol.epub") → raw text' },
  { label: "Chunk", detail: "RecursiveCharacterTextSplitter → ~500-char chunks, 50 overlap" },
  { label: "Embed", detail: "BAAI/bge-small-en-v1.5 encodes each chunk into a vector" },
  { label: "Store", detail: "Vectors + text saved into ChromaDB collection" },
  { label: "Query", detail: '"Who is Scrooge?" embedded with the same model' },
  { label: "Retrieve (bi-encoder)", detail: "Top 50 nearest chunks by cosine similarity" },
  { label: "Rerank (cross-encoder)", detail: "ms-marco-MiniLM-L-6-v2 rescopes to the best 5" },
  { label: "Answer", detail: "flan-t5-base generates an answer grounded in the top chunks" },
];

export default function RagPipelineSandbox() {
  const { activeIndex, playing, play, reset } = useStepPlayer(STEPS, 950);

  return (
    <div className="sandbox">
      <h4>Sandbox — Full RAG Pipeline, End to End</h4>
      <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: -4 }}>
        This is the entire Day 3 workshop as one pipeline — useful as the backbone for a group
        project (swap "A Christmas Carol" for your own document set).
      </p>
      <div className="run-controls">
        <button onClick={play} disabled={playing}>{playing ? "Running…" : "▶ Run pipeline"}</button>
        <button onClick={reset}>Reset</button>
      </div>
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{ width: `${activeIndex < 0 ? 0 : ((activeIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>
      <AnimatedFlow steps={STEPS} activeIndex={activeIndex} />
      <div className="step-payload fade-in" key={activeIndex}>
        {activeIndex >= 0 ? STEPS[activeIndex].detail : "Click \"Run pipeline\" to step through load → chunk → embed → retrieve → rerank → answer."}
      </div>
    </div>
  );
}
