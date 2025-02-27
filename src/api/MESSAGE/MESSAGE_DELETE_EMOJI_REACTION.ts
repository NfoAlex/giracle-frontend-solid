import type {IReaciton} from "~/types/Message";

export default async function DELETE_MESSAGE_DELETE_EMOJI_REACTION(
  _messageId: string,
  _channelId: string,
  _emojiCode: string
): Promise<{
  message: `Message reacted.`;
  data: IReaciton;
}> {
  const res = await fetch("/api/message/delete-emoji-reaction", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId: _messageId,
      channelId: _channelId,
      emojiCode: _emojiCode
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_DELETE_EMOJI_REACTION :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
