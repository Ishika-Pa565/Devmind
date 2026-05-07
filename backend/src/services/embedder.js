const weaviate = require('weaviate-client');

let client = null;
const CLASS_NAME = 'Issue';

async function getClient() {
  if (!client) {
    client = await weaviate.connectToLocal({
      host: 'localhost',
      port: 8080,
    });
  }
  return client;
}

async function ensureSchema() {
  const c = await getClient();
  const exists = await c.collections.exists(CLASS_NAME);
  if (!exists) {
    await c.collections.create({
      name: CLASS_NAME,
      vectorizers: weaviate.configure.vectorizer.none(),
      properties: [
        { name: 'issueId',  dataType: weaviate.configure.dataType.INT    },
        { name: 'text',     dataType: weaviate.configure.dataType.TEXT    },
      ],
    });
    console.log('✅ Weaviate schema created');
  }
}

// Simple deterministic 128-dim embedding (upgrades to real model in Week 3)
function simpleEmbed(text) {
  const words = text.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/);
  const vec = new Array(128).fill(0);
  words.forEach(word => {
    let hash = 0;
    for (const c of word) hash = (hash * 31 + c.charCodeAt(0)) % 128;
    vec[Math.abs(hash)] += 1;
  });
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
}

async function addIssue(issueId, text) {
  await ensureSchema();
  const c = await getClient();
  const collection = c.collections.get(CLASS_NAME);

  await collection.data.insert({
    properties: { issueId, text },
    vectors: simpleEmbed(text),
  });

  console.log(`📌 [Weaviate] Stored issue #${issueId}`);
}

async function findSimilar(text, topK = 3) {
  await ensureSchema();
  const c = await getClient();
  const collection = c.collections.get(CLASS_NAME);

  const result = await collection.query.nearVector(simpleEmbed(text), {
    limit: topK,
    returnMetadata: ['distance'],
  });

  return result.objects.map(obj => ({
    id:       obj.properties.issueId,
    distance: obj.metadata.distance,
    document: obj.properties.text,
  }));
}

module.exports = { addIssue, findSimilar };