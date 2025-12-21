import News from "../sharedFunction/database/models/News.js";
import sequelize from "../sharedFunction/database/connection.js";
import esClient from "../sharedFunction/elastic/connection.js";
import ensureElasticIndex from "../sharedFunction/elastic/ensureIndex.js";
import {
  closeRabbitMQ,
  initRabbitMQ,
} from "../sharedFunction/rabbitMQ/connection.js";
import "dotenv/config";

const MAX_RETRY = Number(process.env.WORKER_MAX_RETRY || 3);
const RETRY_DELAY_MS = Number(process.env.WORKER_RETRY_DELAY_MS || 2000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const requeueWithBackoff = async (channel, msg, attempts) => {
  const delay = RETRY_DELAY_MS * (attempts + 1);
  console.warn(
    `Worker: retrying job in ${delay}ms (attempt ${attempts + 1}/${MAX_RETRY})`
  );

  await sleep(delay);
  channel.sendToQueue(msg.fields.routingKey, msg.content, {
    persistent: true,
    headers: { attempts: attempts + 1 },
  });
  channel.ack(msg);
};

const handleMessage = async (channel, msg) => {
  if (!msg) return;

  const attempts = Number(msg.properties.headers?.attempts || 0);
  try {
    const payload = JSON.parse(msg.content.toString());
    const { newsId } = payload;
    const news = await News.findByPk(newsId);

    if (!news) {
      console.log("Worker: News id not found, ack");
      channel.ack(msg);
      return;
    }

    // Idempotent because Elasticsearch doc id is news.id
    await esClient.index({
      index: process.env.ELASTICSEARCH_INDEX,
      id: news.id.toString(),
      document: {
        title: news.title,
        content: news.content,
        author: news.author,
        source: news.source,
        created_at: news.created_at,
      },
    });

    channel.ack(msg);
  } catch (error) {
    console.error("Worker job failed:", error.message);
    if (attempts + 1 >= MAX_RETRY) {
      console.error("Worker: max retry reached, dropping message");
      channel.nack(msg, false, false);
      return;
    }
    await requeueWithBackoff(channel, msg, attempts);
  }
};

let restarting = false;

const setupConsumer = async () => {
  const channel = await initRabbitMQ();
  channel.prefetch(Number(process.env.WORKER_PREFETCH || 1));

  channel.on("close", () => {
    console.warn("Worker: channel closed, scheduling restart");
    scheduleRestart();
  });
  channel.on("error", (err) => {
    console.error("Worker: channel error:", err.message);
  });

  await ensureElasticIndex();

  await channel.consume(process.env.RABBITMQ_QUEUE, (msg) =>
    handleMessage(channel, msg)
  );
  console.log("Worker: consuming queue");
};

const scheduleRestart = () => {
  if (restarting) return;
  restarting = true;
  setTimeout(async () => {
    try {
      await setupConsumer();
    } catch (err) {
      console.error("Worker: failed to restart consumer:", err.message);
      scheduleRestart();
    } finally {
      restarting = false;
    }
  }, 1000);
};

const startWorker = async () => {
  try {
    await sequelize.authenticate();
    console.log("Worker: connected to DB");

    await ensureElasticIndex();
    console.log("Worker: Elasticsearch index ensured");

    await setupConsumer();
  } catch (error) {
    console.error("Worker failed to start:", error.message);

    if (sequelize) await sequelize.close();
    await closeRabbitMQ();

    process.exit(1);
  }
};

startWorker();
