import type { IMessage } from "~/types/Message.ts";

export default async function GET_MESSAGE_GET(_messageId: string): Promise<{
  message: "Fetched message",
  data: IMessage
}> {
  const res = await fetch("/api/message/" + _messageId, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_GET :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
