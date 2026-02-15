import { getChannel } from "../amqp/amqp";

export async function publishLinkVisited(data: any) {
  const channel = getChannel();

  channel.publish("url_events", "", Buffer.from(JSON.stringify(data)));
}
