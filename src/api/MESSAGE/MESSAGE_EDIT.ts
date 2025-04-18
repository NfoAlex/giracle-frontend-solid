import type {IMessage} from "~/types/Message";

export default async function POST_MESSAGE_EDIT(
  _messageId: string,
  _content: string
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
      content: _content,
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_EDIT :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
