import News from "../sharedFunction/database/models/News.js";
import sequelize from "../sharedFunction/database/connection.js";
import esClient from "../sharedFunction/elastic/connection.js";
import {
  closeRabbitMQ,
  getChannel,
  initRabbitMQ,
} from "../sharedFunction/rabbitMQ/connection.js";
import "dotenv/config";

const startWorker = async () => {
  try {
    await sequelize.authenticate();
    console.log("Worker: connected to DB");

    await initRabbitMQ();
    console.log("Worker: connected to RabbitMQ");

    const channel = getChannel();
    channel.prefetch(Number(process.env.WORKER_PREFETCH || 1));

    channel.consume(process.env.RABBITMQ_QUEUE, async (msg) => {
      if (!msg) return;
      try {
        const payload = JSON.parse(msg.content.toString());
        const { newsId } = payload;
        const news = await News.findByPk(newsId);

        if (!news) {
          console.log("Worker: News id not found");
          channel.ack(msg);
          return;
        }

        await esClient.index({
          index: process.env.ELASTICSEARCH_INDEX,
          id: news.id,
          document: {
            title: news.title,
            content: news.content,
            author: news.author,
            source: news.source,
            created_at: news.createdAt,
          },
        });

        channel.ack(msg);
      } catch (error) {
        console.log(`Worker job failed: ${error}`);
        channel.nack(msg, false, false);
      }
    });
  } catch (error) {
    console.log(`Worker failed to start, ${error}`);

    if (sequelize) await sequelize.close();
    await closeRabbitMQ();

    process.exit(1);
  }
};

startWorker();
