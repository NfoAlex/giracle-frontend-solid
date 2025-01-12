import type { IMessage } from "~/types/Message";

export default async function POST_MESSAGE_SEND(
  _channelId: string,
  _message: string,
  _fileIds: string[]
): Promise<{
  message: `Message sent`;
  data: IMessage;
}> {
  const res = await fetch("/api/message/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId,
      message: _message,
      fileIds: _fileIds,
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_SEND :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
