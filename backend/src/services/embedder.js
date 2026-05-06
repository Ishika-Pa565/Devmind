const { ChromaClient } = require('chromadb');

const chroma = new ChromaClient({ path: 'http://localhost:8000' });

let collection = null;

async function getCollection() {
  if (!collection) {
    collection = await chroma.getOrCreateCollection({
      name: 'issues',
      metadata: { 'hnsw:space': 'cosine' },
    });
  }
  return collection;
}

// Simple bag-of-words embedding (no external model needed for Week 2)
// We'll upgrade to real embeddings in Week 3
function simpleEmbed(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
  const vocab = {};
  words.forEach(w => { vocab[w] = (vocab[w] || 0) + 1; });
  // Fixed 128-dim vector using hash
  const vec = new Array(128).fill(0);
  Object.entries(vocab).forEach(([word, count]) => {
    let hash = 0;
    for (const c of word) hash = (hash * 31 + c.charCodeAt(0)) % 128;
    vec[Math.abs(hash)] += count;
  });
  // Normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
}

async function addIssue(id, text) {
  const col = await getCollection();
  const embedding = simpleEmbed(text);
  await col.add({
    ids: [String(id)],
    embeddings: [embedding],
    documents: [text],
  });
}

async function findSimilar(text, topK = 3) {
  const col = await getCollection();
  const count = await col.count();
  if (count === 0) return [];

  const embedding = simpleEmbed(text);
  const results = await col.query({
    queryEmbeddings: [embedding],
    nResults: Math.min(topK, count),
  });

  return results.ids[0].map((id, i) => ({
    id,
    distance: results.distances[0][i],
    document: results.documents[0][i],
  }));
}

module.exports = { addIssue, findSimilar };