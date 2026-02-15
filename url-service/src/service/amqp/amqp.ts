import amqp from "amqplib";
import { type Channel } from "amqplib";

let channel: Channel;

export async function connectRabbit() {
  const connection = await amqp.connect("amqp://admin:admin@localhost");
  channel = await connection.createChannel();
  await channel.assertExchange("url_events", "fanout");
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("RabbitMQ not connected");
  return channel;
}
