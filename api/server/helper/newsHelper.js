import News from "../../sharedFunction/database/models/News.js";
import esClient from "../../sharedFunction/elastic/connection.js";
import { getChannel } from "../../sharedFunction/rabbitMQ/connection.js";

export const addNewsHelper = async (payload) => {
  try {
    const news = await News.create({
      title: payload.title,
      content: payload.content,
      author: payload.author,
      source: payload.source,
      created_at: new Date(),
    });

    const channel = getChannel();

    channel.sendToQueue(
      process.env.RABBITMQ_QUEUE,
      Buffer.from(JSON.stringify({ newsId: news.id })),
      {
        persistent: true,
      }
    );

    return { id: news.id };
  } catch (error) {
    console.error("[createNewsHelper] Error:", error.message);
    throw error;
  }
};

export const searchHelper = async (query) => {
  try {
    const result = await esClient.search({
      index: process.env.ELASTICSEARCH_INDEX,
      query: {
        multi_match: {
          query,
          fields: ["title", "content", "author", "source"],
          fuzziness: "AUTO",
        },
      },
    });

    return result.hits.hits.map((item) => ({
      id: Number(item._id),
      title: item._source.title,
      content: item._source.content,
      author: item._source.author,
      source: item._source.source,
      created_at: item._source.created_at,
    }));
  } catch (error) {
    console.error("[searchNewsHelper] Error:", error.message);
    throw error;
  }
};

export const getNewsHelper = async (dataObject) => {
  try {
    const { page = 1, limit = 10 } = dataObject;

    const offset = (page - 1) * limit;

    const { rows, count } = await News.findAndCountAll({
      limit: Number(limit),
      offset,
    });

    return {
      page: Number(page),
      limit: Number(limit),
      total: count,
      data: rows,
    };
  } catch (error) {
    console.error("[getNewsHelper] Error:", error.message);
    throw error;
  }
};
