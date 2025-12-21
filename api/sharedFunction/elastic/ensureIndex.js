import esClient from "./connection.js";

const ES_INDEX = process.env.ELASTICSEARCH_INDEX || "news";

/**
 * Ensure the Elasticsearch index exists with basic mappings.
 * This is idempotent and safe to call multiple times.
 */
const ensureElasticIndex = async () => {
  const exists = await esClient.indices.exists({ index: ES_INDEX });
  if (exists) return;

  await esClient.indices.create({
    index: ES_INDEX,
    mappings: {
      properties: {
        title: { type: "text" },
        content: { type: "text" },
        author: { type: "keyword" },
        source: { type: "keyword" },
        created_at: { type: "date" },
      },
    },
  });
};

export default ensureElasticIndex;
