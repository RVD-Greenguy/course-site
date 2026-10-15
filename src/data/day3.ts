export const loadersCode = `from langchain_community.document_loaders import (
    UnstructuredEPubLoader, UnstructuredExcelLoader, UnstructuredPowerPointLoader,
    PyPDFLoader, Docx2txtLoader, JSONLoader, UnstructuredXMLLoader,
    UnstructuredEmailLoader,
)
from langchain_text_splitters import RecursiveCharacterTextSplitter, RecursiveJsonSplitter

# Every loader returns a list[Document] with .page_content + .metadata — this
# common interface is the whole point: downstream code (splitter, embedder,
# Chroma) never needs to know which file format a chunk originally came from.
#
# mode="single"  -> whole doc as one Document (default for most loaders) —
#   fine when you'll re-chunk anyway with a text splitter.
# mode="elements" or "multi" -> one Document per page/slide/sheet/row —
#   use this when the structural boundary (e.g. "slide 7") is itself useful
#   metadata to keep attached to the chunk for citation/filtering later.

pdf_docs = PyPDFLoader("report.pdf").load()
docx_docs = Docx2txtLoader("memo.docx").load()
# Unstructured loaders shell out to format-specific parsers (python-pptx,
# openpyxl, etc.) under the hood — slower to install but handle messier
# real-world files (merged table cells, embedded images) that the simpler
# loaders above don't attempt to parse.
epub_docs = UnstructuredEPubLoader("book.epub").load()`;

export const splitterCode = `splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
)
chunks = splitter.split_documents(epub_docs)
# chunk_size=500 keeps each fragment small enough that 5 retrieved chunks
# (n_results=5 below) still fit comfortably inside flan-t5-base's context
# window alongside the question and prompt scaffolding.
#
# chunk_overlap=50 (10% of chunk_size) prevents a sentence that straddles a
# chunk boundary from being split mid-thought and losing retrievability in
# both halves — the tradeoff is ~10% more chunks to embed and store.
#
# "Recursive" means it tries to split on paragraph breaks ("\\n\\n") first,
# then sentences, then words, then characters — only falling back to a harder
# cut when a semantic boundary isn't available within chunk_size.`;

export const embedChromaCode = `from chromadb.utils import embedding_functions
import chromadb
from uuid import uuid4

# bge-small-en-v1.5 outputs 384-dim vectors — small enough to index millions
# of chunks in memory while still being a strong general-purpose embedder.
embed_model_name = "BAAI/bge-small-en-v1.5"
embedder = embedding_functions.SentenceTransformerEmbeddingFunction(model_name=embed_model_name)

# Ephemeral (in-memory, not persisted to disk) — fine for a workshop/demo;
# use chromadb.PersistentClient(path=...) to survive a restart.
client = chromadb.Client()
# Chroma's default distance space for SentenceTransformer embedders is cosine
# similarity (see the Vector Similarity calculator above for the actual math).
collection = client.create_collection(name="christmas_carol", embedding_function=embedder)

collection.add(
    documents=[c.page_content for c in chunks],
    ids=[str(uuid4()) for _ in chunks],  # Chroma requires a unique id per document
)

# n_results=5 instead of 1: retrieval is deliberately over-wide here because
# Stage 2 (cross-encoder reranking, below) is what actually picks the best match.
results = collection.query(query_texts=["Who is Scrooge?"], n_results=5)`;

export const rerankCode = `from sentence_transformers import CrossEncoder

# Bi-encoder (Chroma's embedder) encodes query and documents SEPARATELY, so it's
# fast enough to search a huge corpus but less accurate (no cross-attention
# between query and document). Cross-encoder re-scores query+document pairs
# TOGETHER, with full attention across both — slow (can't pre-index), but much
# more accurate; that's why it only runs on the bi-encoder's narrowed shortlist.
cross_encoder = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

query = "Who is Scrooge?"
candidates = results["documents"][0]  # top-k from bi-encoder retrieval

pairs = [[query, doc] for doc in candidates]
scores = cross_encoder.predict(pairs)  # higher score = more relevant to this exact query

reranked = sorted(zip(candidates, scores), key=lambda x: x[1], reverse=True)`;

export const ragQaCode = `from transformers import AutoTokenizer, AutoModelForSeq2SeqLM

# Seq2Seq (encoder-decoder), not a decoder-only causal LM: flan-t5-base reads
# the whole prompt with bidirectional attention before generating the answer,
# which suits short-context Q&A better than it suits long free-form chat.
tokenizer = AutoTokenizer.from_pretrained("google/flan-t5-base")
model = AutoModelForSeq2SeqLM.from_pretrained("google/flan-t5-base")

question = "Who is Scrooge?"
# reranked[:5], not all retrieved candidates — the cross-encoder's top 5 are
# the chunks actually worth spending context-window budget on; this is where
# Stage 2's accuracy gain (over Stage 1 alone) turns into better answers.
context = "\\n".join(doc for doc, score in reranked[:5])

# Instructing the model to answer "based on the context" (vs. its own
# parametric knowledge) is what makes this RAG rather than plain generation —
# it grounds the answer in the retrieved text instead of the model's priors.
prompt = f"Answer the question based on the context.\\n\\nContext: {context}\\n\\nQuestion: {question}"
inputs = tokenizer(prompt, return_tensors="pt", truncation=True)
# max_new_tokens=100 caps answer length deliberately — flan-t5 tends to
# ramble/repeat past this on short factual questions.
outputs = model.generate(**inputs, max_new_tokens=100)
answer = tokenizer.decode(outputs[0], skip_special_tokens=True)`;

export const twoStagePipeline = [
  { stage: "Stage 1 — Retrieval (Bi-Encoder)", desc: "Embeds query & documents independently into vectors, then ranks by cosine similarity. Fast — narrows millions of docs down to top 50-100 candidates." },
  { stage: "Stage 2 — Re-ranking (Cross-Encoder)", desc: "Embeds query+document together with full word-by-word cross-attention. Slower but far more accurate — re-sorts the top candidates." },
];

export const loaderTable = [
  { format: "PDF", loader: "PyPDFLoader" },
  { format: "DOCX", loader: "Docx2txtLoader" },
  { format: "EPUB", loader: "UnstructuredEPubLoader" },
  { format: "PPTX", loader: "UnstructuredPowerPointLoader" },
  { format: "XLSX", loader: "UnstructuredExcelLoader" },
  { format: "XML", loader: "UnstructuredXMLLoader" },
  { format: "Email", loader: "UnstructuredEmailLoader" },
  { format: "JSON", loader: "JSONLoader" },
];

export const sqlVsVectorCode = `# SQL (Postgres) — exact-match / structured lookup
# "Get this user's last 20 played tracks"
SELECT track_id, title, played_at
FROM play_history
WHERE user_id = 42
ORDER BY played_at DESC
LIMIT 20;
# Fast and exact because user_id is indexed (B-tree) — but there is no
# SQL WHERE clause for "tracks that SOUND like this one."

# Vector DB (ChromaDB / pgvector) — similarity lookup
# "Get tracks that sound like this one"
results = collection.query(
    query_embeddings=[now_playing_vector],  # [energy, valence, danceability, acousticness]
    n_results=5,
)
# ChromaDB computes cosine distance between now_playing_vector and every
# indexed track's vector (via an ANN index like HNSW), and returns the
# closest — this has no equivalent as a plain SQL WHERE/ORDER BY.

# Real systems use BOTH side by side:
#   Postgres: user accounts, playlists, play history, song metadata (title/artist/album)
#   Vector DB: the song's audio-feature embedding, for "find similar" queries
# pgvector exists specifically so Postgres can do both in one database if you
# don't want to run two systems — it adds a VECTOR column type + <-> distance
# operator on top of ordinary SQL tables.`;

export const databaseComparison = [
  {
    aspect: "What it stores",
    sql: "Rows with fixed columns (user_id, title, artist, play_count) — structured, typed data.",
    vector: "High-dimensional embedding vectors (e.g. 384-dim for bge-small, or 4-dim audio features here) + metadata.",
  },
  {
    aspect: "Query it answers well",
    sql: '"Get all songs by artist X" / "Count plays for user 42 this week" — exact filters, joins, aggregates.',
    vector: '"Find songs that sound like this one" / "Find text similar in meaning to this question" — similarity, not exact match.',
  },
  {
    aspect: "Index type",
    sql: "B-tree / hash indexes — exact equality and range lookups.",
    vector: "ANN (Approximate Nearest Neighbor) indexes like HNSW — fast nearest-neighbor search in high dimensions, trading a little accuracy for huge speed at scale.",
  },
  {
    aspect: "This course's example",
    sql: "A conventional Postgres table of users, playlists, and play history (not covered in Day 3 materials, but what every real app needs alongside RAG).",
    vector: "ChromaDB storing bge-small-en-v1.5 embeddings of document chunks for retrieval — the Day 3 workshop's actual subject.",
  },
  {
    aspect: "Can one DB do both?",
    sql: "Postgres alone: no native similarity search.",
    vector: "pgvector extension adds a VECTOR column + distance operators to Postgres — lets one database serve both exact (SQL) and similarity (vector) queries, avoiding a second system.",
  },
];

export const day3Resources = [
  {
    title: "LangChain document loaders",
    url: "https://python.langchain.com/docs/concepts/document_loaders/",
    desc: "Full catalogue of loaders for PDF/DOCX/EPUB/PPTX/XML/email/JSON.",
    headings: ["Document loader concept", "Integration catalogue (per file format)", "Common Document interface"],
    summary: "Every loader — regardless of source format — returns a common list[Document] interface with .page_content and .metadata, so a splitter/embedder/vector-store downstream never needs format-specific branching. The catalogue covers 100+ integrations (PDF, DOCX, EPUB, PPTX, databases, web pages, etc.).",
    howTo: "Pick the loader matching your file type (PyPDFLoader for PDF, Docx2txtLoader for DOCX, UnstructuredEPubLoader for EPUB, ...), call .load(), and treat the result identically regardless of source — see loadersCode above for the exact pattern used in this course's reference implementation.",
  },
  {
    title: "RecursiveCharacterTextSplitter",
    url: "https://python.langchain.com/docs/concepts/text_splitters/",
    desc: "Chunking strategy used before embedding.",
    headings: ["Why split text", "chunk_size / chunk_overlap", "Recursive separator priority (paragraph → sentence → word → char)"],
    summary: "Splitting keeps each fragment small enough to fit comfortably inside an LLM's context window alongside retrieved-context prompting, while chunk_overlap prevents a sentence that straddles a chunk boundary from losing retrievability in both halves. \"Recursive\" means the splitter tries paragraph breaks first, then sentences, then words, only falling back to a hard character cut when no semantic boundary fits within chunk_size.",
    howTo: "RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50).split_documents(docs) — see the Chunking sandbox above on this page for a live, editable version of exactly this tradeoff (bigger chunk_size = fewer, more-context-rich chunks; more overlap = more redundant storage but fewer boundary-split sentences).",
  },
  {
    title: "BAAI/bge-small-en-v1.5 model card",
    url: "https://huggingface.co/BAAI/bge-small-en-v1.5",
    desc: "Embedding model used to vectorize chunks.",
    headings: ["Model description", "Usage (sentence-transformers / Transformers)", "Evaluation (MTEB benchmark)"],
    summary: "A compact (33M param) sentence-embedding model producing 384-dimension vectors — small enough to embed and store millions of chunks in memory while still ranking competitively on the MTEB retrieval benchmark against much larger embedders.",
    howTo: "SentenceTransformerEmbeddingFunction(model_name=\"BAAI/bge-small-en-v1.5\") plugs directly into Chroma's embedding_function parameter — see embedChromaCode above; Chroma's default distance metric for this embedder is cosine similarity (see the Embedding Similarity calculator above for the actual math).",
  },
  {
    title: "ChromaDB docs",
    url: "https://docs.trychroma.com/",
    desc: "Vector store used for similarity search.",
    headings: ["Introduction", "What Chroma Offers", "Quickstart", "Example Projects"],
    summary: "Chroma is open-source AI data infrastructure: stores embeddings alongside metadata and supports dense/sparse/hybrid search, keyword & regex filtering, and multi-modal indexing (text/image/audio). Can run embedded (chromadb.Client(), in-memory) or persistent (PersistentClient) or hosted (Chroma Cloud).",
    howTo: "client.create_collection(name=..., embedding_function=...) then collection.add(documents=..., ids=...) to index, collection.query(query_texts=[...], n_results=k) to retrieve — exactly the sequence in embedChromaCode above; use PersistentClient(path=...) instead of Client() to survive a process restart.",
  },
  {
    title: "cross-encoder/ms-marco-MiniLM-L-6-v2",
    url: "https://huggingface.co/cross-encoder/ms-marco-MiniLM-L-6-v2",
    desc: "Cross-encoder used for re-ranking retrieved chunks.",
    headings: ["Usage (SentenceTransformers / Transformers)", "Performance benchmarks (TREC, MS Marco)", "Training data"],
    summary: "Scores query+passage pairs together with full cross-attention (NDCG@10 of 74.30 on TREC DL 2019) — much more accurate than a bi-encoder's separate-then-compare approach, but too slow to run over an entire corpus, which is why it only reranks the bi-encoder's narrowed shortlist.",
    howTo: "CrossEncoder(\"cross-encoder/ms-marco-MiniLM-L-6-v2\").predict([[query, doc] for doc in candidates]) returns a relevance score per pair; sort descending and keep the top few — see rerankCode above for the exact two-stage retrieve-then-rerank pipeline.",
  },
  {
    title: "pgvector — vector search in Postgres",
    url: "https://github.com/pgvector/pgvector",
    desc: "Add a VECTOR column + similarity search to a conventional SQL database.",
    headings: ["Installation", "Vector types (vector, halfvec, sparsevec)", "Querying (L2/cosine/inner-product distance operators)", "Indexing (HNSW, IVFFlat)"],
    summary: "pgvector is a Postgres extension that adds a vector column type and distance operators (<-> for L2, <=> for cosine) so similarity search runs as plain SQL alongside ordinary joins/filters, instead of needing a separate ChromaDB/Pinecone instance. Supports the same HNSW ANN indexing that dedicated vector DBs use.",
    howTo: "CREATE EXTENSION vector; then ALTER TABLE songs ADD COLUMN embedding vector(384); — insert vectors as normal rows, then SELECT * FROM songs ORDER BY embedding <=> query_vector LIMIT 5; returns nearest neighbors with regular SQL, see databaseComparison above for when this is worth it vs a dedicated vector DB.",
  },
  {
    title: "Spotify Web API — Audio Features",
    url: "https://developer.spotify.com/documentation/web-api",
    desc: "Real-world precedent for the song-vector sandbox above (danceability/energy/valence/acousticness).",
    headings: ["Get Audio Features for a Track", "Get Recommendations"],
    summary: "Spotify's own API exposes exactly this kind of per-track feature vector (danceability, energy, valence, acousticness, tempo, and more), which is the public documentation of the same embedding-based recommendation pattern this page's sandbox demonstrates at a toy scale.",
    howTo: "This course site doesn't call Spotify's API (it uses a small hardcoded song library instead) — but the real pattern is: fetch audio features per track, store as vectors in a vector DB, and query nearest-neighbors for 'similar songs', exactly like the sandbox's cosine-similarity ranking.",
  },
];
