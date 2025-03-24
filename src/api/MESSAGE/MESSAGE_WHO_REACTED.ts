
/**
 * 対象のメッセージIdに対して、指定された絵文字をリアクションしているユーザーを取得する
 * @param _messageId 調べたいメッセージId
 * @param _emojiCode リアクションしたユーザーを調べる絵文字コード
 * @returns 
 */
export default async function GET_MESSAGE_WHO_REACTED(
  _messageId: string,
  _emojiCode: string
): Promise<{
  message: "Fetched reactions",
  data: string[]
}> {
  const res = await fetch(`/api/message/who-reacted?messageId=${_messageId}&emojiCode=${_emojiCode}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_WHO_REACTED :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
