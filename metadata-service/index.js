import amqp from "amqplib";
import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  password: "postgres",
  database: "url_db",
});

let channel;

// Connect to RabbitMQ and consume messages
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

// Consume messages from RabbitMQ
async function consumeMessages() {
  await pool.connect();
  let channel = await connectRabbit();
  const q = await channel.assertQueue("", { exclusive: true });
  channel.bindQueue(q.queue, "url_events", "");

  channel.consume(q.queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    if (data.event === "link_visited") {
      try {
        await pool.query(
          `INSERT INTO url_metadata (original_url, short_code, ip) VALUES
            ($1, $2, $3) ON CONFLICT (short_code) DO UPDATE SET
            ip = EXCLUDED.ip;`,
          [data.original_url, data.shortCode, data.ip]
        );
        console.log(`Updated visit count for ${data.shortCode}`);
      } catch (err) {
        console.error("Error updating metadata:", err);
      }
    }
    channel.ack(msg);
  });
}

await consumeMessages().catch((err) => {
  console.error("Error consuming messages:", err);
});
