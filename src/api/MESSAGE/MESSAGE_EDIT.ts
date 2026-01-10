import type {IMessage} from "~/types/Message.ts";

export default async function POST_MESSAGE_EDIT(
  _messageId: string,
  _message: string
): Promise<{
  message: `Message edited`;
  data: IMessage;
}> {
  const res = await fetch("/api/message/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId: _messageId,
      message: _message,
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_EDIT :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
