import {ICustomEmoji} from "~/types/Message.ts";

export default async function DELETE_SERVER_CUSTOM_EMOJI_DELETE(
  _emojiCode: string,
): Promise<{
  message: string;
  data: ICustomEmoji[];
}> {
  const res = await fetch("/api/server/custom-emoji/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      emojiCode: _emojiCode,
    })
  }).catch((err) => {
    throw new Error("SERVER_CUSTOM_EMOJI_DELETE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
