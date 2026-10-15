import CodeBlock from "../components/CodeBlock";
import DashboardTabs from "../components/DashboardTabs";
import StatRow from "../components/StatRow";
import RealWorldExample from "../components/RealWorldExample";
import ChunkingSandbox from "../sandboxes/ChunkingSandbox";
import RerankSandbox from "../sandboxes/RerankSandbox";
import RagPipelineSandbox from "../sandboxes/RagPipelineSandbox";
import EmbeddingSimilarityCalculator from "../sandboxes/EmbeddingSimilarityCalculator";
import MusicVectorDbSandbox from "../sandboxes/MusicVectorDbSandbox";
import Evidence from "../components/Evidence";
import ResourceList from "../components/ResourceList";
import {
  loadersCode, splitterCode, embedChromaCode, rerankCode, ragQaCode,
  twoStagePipeline, loaderTable, day3Resources, sqlVsVectorCode, databaseComparison,
} from "../data/day3";

export default function Day3() {
  return (
    <div>
      <h1>Day 3 — Document Loaders & RAG</h1>
      <p style={{ color: "var(--text-dim)" }}>
        Loading and chunking documents, building a vector store, and a full retrieval-augmented
        Q&A pipeline over "A Christmas Carol".
      </p>

      <Evidence
        kind="external"
        source="Gap in course materials"
        note='Both Day 3 workshop notebooks (day03-loaders-blank-v2.1.ipynb, day03-rag-v3.4-blank.ipynb) are entirely unfilled TODO scaffolds — no working embedding/ChromaDB/rerank code exists in the course materials themselves, and the 111-page slide deck shows chunking diagrams but never the actual cosine-similarity/vector-search math. Everything below is a complete, well-commented reference implementation we wrote using the exact model names the blank notebook names (BAAI/bge-small-en-v1.5, cross-encoder/ms-marco-MiniLM-L-6-v2, google/flan-t5-base) — this is the working code+math the instructor skipped.'
      />

      <StatRow
        stats={[
          { label: "Chunk size", value: "~500 chars" },
          { label: "Embedding dims", value: "384 (bge-small)" },
          { label: "Retrieve → rerank", value: "50 → 5" },
          { label: "Answer model", value: "flan-t5-base" },
        ]}
      />

      <h2>Pipeline dashboard</h2>
      <DashboardTabs
        defaultTab="pipeline"
        tabs={[
          {
            id: "pipeline",
            label: "Full pipeline",
            content: (
              <>
                <RagPipelineSandbox />
                <RealWorldExample
                  title="RAG replacing a brittle search box"
                  scenarios={[
                    {
                      label: "Internal wiki search",
                      scenario: "An engineering team's Confluence has 3,000 pages; keyword search for \"how do I rotate the prod DB credentials\" returns 40 loosely-related pages because none contain that exact phrase.",
                      outcome: "RAG embeds the question and retrieves by meaning, not exact words, then an LLM synthesizes a direct answer with citations — the same load→chunk→embed→retrieve→rerank→answer pipeline in this sandbox.",
                    },
                    {
                      label: "Customer-facing docs bot",
                      scenario: "A SaaS product's docs site gets \"why is my API key not working\" in 50 different phrasings a day, and the docs team can't write an FAQ entry for every phrasing.",
                      outcome: "One RAG pipeline over the existing docs handles all phrasings — the embedding model (bge-small) maps semantically similar questions near each other in vector space regardless of exact wording.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "loaders",
            label: "Loaders",
            content: (
              <>
                <table className="table">
                  <thead><tr><th>Format</th><th>LangChain loader</th></tr></thead>
                  <tbody>
                    {loaderTable.map((l) => (
                      <tr key={l.format}><td>{l.format}</td><td><code>{l.loader}</code></td></tr>
                    ))}
                  </tbody>
                </table>
                <CodeBlock code={loadersCode} title="document loaders" />
                <RealWorldExample
                  title="messy real-world document sets"
                  scenarios={[
                    {
                      label: "Legal/compliance",
                      scenario: "A law firm's knowledge base is a mix of scanned PDFs, Word contracts, and emailed PDF amendments — not a clean text export.",
                      outcome: "PyPDFLoader + Docx2txtLoader + UnstructuredEmailLoader all normalize to the same Document interface, so one chunking/embedding pipeline handles all three formats without format-specific code downstream.",
                    },
                    {
                      label: "Finance reporting",
                      scenario: "A finance team's RAG corpus is quarterly earnings decks (PowerPoint) and spreadsheets (Excel) full of numbers, not prose.",
                      outcome: "UnstructuredPowerPointLoader + UnstructuredExcelLoader extract text/table content into the same chunkable form — this is why having one loader per format matters: the splitter/embedder/retriever code never changes.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "chunking",
            label: "Chunking",
            badge: "interactive",
            content: (
              <>
                <CodeBlock code={splitterCode} title="RecursiveCharacterTextSplitter" />
                <ChunkingSandbox />
                <RealWorldExample
                  title="chunk size is a real design decision"
                  scenarios={[
                    {
                      label: "Too small",
                      scenario: "A policy-FAQ RAG bot chunks a legal clause into 50-character pieces to maximize retrieval precision.",
                      outcome: "A single clause like \"employees may carry over up to 5 days of leave, except during their first year\" gets split mid-sentence — retrieval returns the first half without the critical exception, and the bot gives a wrong answer confidently.",
                    },
                    {
                      label: "Too large",
                      scenario: "The same bot instead chunks a whole 10-page policy document as one chunk, to never split a sentence.",
                      outcome: "The embedding for that chunk averages over 10 pages of unrelated topics, so it barely resembles the embedding of a specific question — retrieval quality drops because the chunk's vector is \"about everything, precisely about nothing.\"",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "embeddings",
            label: "Embeddings",
            badge: "interactive",
            content: (
              <>
                <CodeBlock code={embedChromaCode} title="BAAI/bge-small-en-v1.5 + Chroma" />
                <EmbeddingSimilarityCalculator />
                <RealWorldExample
                  title="embeddings beyond text search"
                  scenarios={[
                    {
                      label: "Duplicate ticket detection",
                      scenario: "A support team gets the same bug reported by 30 different customers, worded 30 different ways.",
                      outcome: "Embed every new ticket and compare cosine similarity against open tickets — a score above ~0.85 auto-suggests \"this looks like ticket #4521\", merging duplicates without any keyword matching.",
                    },
                    {
                      label: "Content recommendation",
                      scenario: "A news app wants \"articles similar to the one you just read\" without manually tagging every article's topic.",
                      outcome: "Embed every article once; recommend the nearest neighbors by cosine similarity — this is the same nearest-neighbor math as RAG retrieval, applied to recommendations instead of question-answering.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "rerank",
            label: "Retrieve + rerank",
            badge: "interactive",
            content: (
              <>
                <table className="table">
                  <tbody>
                    {twoStagePipeline.map((s) => (
                      <tr key={s.stage}><th style={{ width: 220 }}>{s.stage}</th><td>{s.desc}</td></tr>
                    ))}
                  </tbody>
                </table>
                <CodeBlock code={rerankCode} title="cross-encoder/ms-marco-MiniLM-L-6-v2" />
                <RerankSandbox />
                <RealWorldExample
                  title="why bother reranking at all"
                  scenarios={[
                    {
                      label: "E-commerce search",
                      scenario: "A shopper searches \"waterproof jacket for toddler\" — the bi-encoder's top-50 includes adult jackets, umbrellas, and toddler shoes because they're all broadly \"outdoor gear for kids/rain.\"",
                      outcome: "The cross-encoder reads the query and each candidate together (not independently) and can tell \"waterproof jacket, size 2T\" is a much better match than \"umbrella\" — this is why production search/RAG systems almost always rerank instead of serving raw bi-encoder results.",
                    },
                  ]}
                />
              </>
            ),
          },
          {
            id: "databases",
            label: "Databases",
            badge: "interactive",
            content: (
              <>
                <p>
                  Day 3's slides never say the word "database" out loud, but ChromaDB <em>is</em> a
                  database — just a specialized one. Real apps almost always run a vector database
                  (for similarity search, like retrieval above) <strong>alongside</strong> a
                  conventional SQL database (for everything else: users, orders, play counts).
                </p>
                <table className="table">
                  <thead><tr><th>Aspect</th><th>SQL (Postgres)</th><th>Vector DB (ChromaDB)</th></tr></thead>
                  <tbody>
                    {databaseComparison.map((row) => (
                      <tr key={row.aspect}>
                        <td style={{ width: 160 }}><strong>{row.aspect}</strong></td>
                        <td style={{ fontSize: 12.5 }}>{row.sql}</td>
                        <td style={{ fontSize: 12.5 }}>{row.vector}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <CodeBlock code={sqlVsVectorCode} title="exact lookup (SQL) vs similarity lookup (vector DB)" />
                <MusicVectorDbSandbox />
              </>
            ),
          },
          {
            id: "qa",
            label: "RAG Q&A",
            content: (
              <>
                <CodeBlock code={ragQaCode} title="FLAN-based question answering over retrieved context" />
                <RealWorldExample
                  title="grounded answers vs hallucination"
                  scenarios={[
                    {
                      label: "Without RAG",
                      scenario: "A base LLM is asked \"what is our company's refund policy for item X?\" with no company data in its training.",
                      outcome: "The model confidently invents a plausible-sounding but wrong policy — this is hallucination, and it's the single biggest reason enterprises don't ship raw LLMs for internal Q&A.",
                    },
                    {
                      label: "With RAG",
                      scenario: "The same question, but the retrieved chunks (the actual refund policy document) are injected into the prompt before generation.",
                      outcome: "The model answers from the provided text instead of its training data — wrong answers now mean a retrieval failure (wrong chunk retrieved), which is debuggable and fixable, unlike an ungrounded hallucination.",
                    },
                  ]}
                />
              </>
            ),
          },
        ]}
      />

      <h2>Resources</h2>
      <ResourceList resources={day3Resources} />
    </div>
  );
}
