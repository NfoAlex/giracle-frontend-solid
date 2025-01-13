import type { IMessage } from "~/types/Message";

export default async function POST_MESSAGE_UPDATE_READTIME(
  _channelId: string,
  _readTime: Date
): Promise<{
  message: `Message sent`;
  data: IMessage;
}> {
  const res = await fetch("/api/message/read-time/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId,
      readTime: _readTime
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_UPDATE_READTIME :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
