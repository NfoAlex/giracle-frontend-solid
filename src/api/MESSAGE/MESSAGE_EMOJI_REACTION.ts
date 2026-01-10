import type {IReaciton} from "~/types/Message.ts";

export default async function POST_MESSAGE_EMOJI_REACTION(
  _messageId: string,
  _channelId: string,
  _emojiCode: string
): Promise<{
  message: `Message reacted.`;
  data: IReaciton;
}> {
  const res = await fetch("/api/message/emoji-reaction", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId: _messageId,
      channelId: _channelId,
      emojiCode: _emojiCode
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_EMOJI_REACTION :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
