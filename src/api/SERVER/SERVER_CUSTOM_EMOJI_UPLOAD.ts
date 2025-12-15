import {ICustomEmoji} from "~/types/Message.ts";

export default async function PUT_SERVER_CUSTOM_EMOJI_UPLOAD(
  _emojiCode: string,
  _emoji: File
): Promise<{
  message: string;
  data: ICustomEmoji[];
}> {
  const formData = new FormData();
  formData.append("emoji", _emoji);
  formData.append("emojiCode", _emojiCode);
  const res = await fetch("/api/server/custom-emoji/upload", {
    method: "PUT",
    body: formData
  }).catch((err) => {
    throw new Error("SERVER_CUSTOM_EMOJI_UPLOAD :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
