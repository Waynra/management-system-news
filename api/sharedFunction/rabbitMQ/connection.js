import amqp from "amqplib";

let channel;
let connection;

export const initRabbitMQ = async () => {
  connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(process.env.RABBITMQ_QUEUE, { durable: true });
};

export const getChannel = () => {
  if (!channel) throw new Error("channel not initialized");
  return channel;
};

export const closeRabbitMQ = async () => {
  if (connection) await connection.close();
  if (channel) await channel.close();
};
