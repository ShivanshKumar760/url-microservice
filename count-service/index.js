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

async function consumeMessages() {
  let channel = await connectRabbit();
  const q = await channel.assertQueue("", { exclusive: true });
  channel.bindQueue(q.queue, "url_events", "");

  channel.consume(q.queue, async (msg) => {
    const data = JSON.parse(msg.content.toString());
    if (data.event === "link_visited") {
      try {
        await pool.query(
          `INSERT INTO url_counts 
          (original_url, short_code, visit_count, last_visited)VALUES 
          ($1, $2, 1, $3) ON CONFLICT (short_code) DO UPDATE SET
          visit_count = url_counts.visit_count + 1,
          last_visited = EXCLUDED.last_visited;
        `,
          [data.original_url, data.shortCode, data.timestamp]
        );

        console.log(`Updated visit count for ${data.shortCode}`);
      } catch (err) {
        console.error("Error updating visit count:", err);
      }
    }
    channel.ack(msg);
  });
}

consumeMessages().catch((err) => {
  console.error("Error consuming messages:", err);
});
