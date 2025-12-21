import amqp from "amqplib";

let channel;
let connection;
let connecting = false;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOptions = () => ({
  heartbeat: 5,
  clientProperties: {
    connection_name: "news-backend",
  },
});

/**
 * Establish RabbitMQ channel with retry + queue assertion.
 * Retries are limited to avoid endless loops on fatal misconfigurations.
 */
export const initRabbitMQ = async () => {
  if (channel) return channel;
  if (connecting) {
    // Wait until the in-flight connection attempt finishes.
    while (connecting) {
      await sleep(200);
    }
    if (channel) return channel;
  }

  const maxRetry = Number(process.env.RABBITMQ_MAX_RETRY || 5);
  const baseDelay = Number(process.env.RABBITMQ_RETRY_DELAY_MS || 2000);

  connecting = true;
  let lastError;

  for (let attempt = 1; attempt <= maxRetry; attempt++) {
    try {
      connection = await amqp.connect(
        process.env.RABBITMQ_URL,
        buildOptions()
      );

      connection.on("close", () => {
        channel = undefined;
        connection = undefined;
        console.warn("[RabbitMQ] connection closed, will reconnect on next use");
      });
      connection.on("error", (err) => {
        console.error("[RabbitMQ] connection error:", err.message);
      });

      channel = await connection.createChannel();
      await channel.assertQueue(process.env.RABBITMQ_QUEUE, { durable: true });
      channel.on("error", (err) => {
        console.error("[RabbitMQ] channel error:", err.message);
      });
      channel.on("close", () => {
        console.warn("[RabbitMQ] channel closed, will reconnect on next use");
        channel = undefined;
      });

      connecting = false;
      return channel;
    } catch (err) {
      lastError = err;
      const delay = baseDelay * attempt;
      console.error(
        `[RabbitMQ] connect attempt ${attempt} failed: ${err.message}, retrying in ${delay}ms`
      );
      await sleep(delay);
    }
  }

  connecting = false;
  throw lastError;
};

export const getChannel = () => {
  if (!channel) throw new Error("RabbitMQ channel not initialized");
  return channel;
};

export const closeRabbitMQ = async () => {
  if (channel) {
    await channel.close();
    channel = undefined;
  }
  if (connection) {
    await connection.close();
    connection = undefined;
  }
};
