
/**
 * 対象のメッセージIdに対して、指定された絵文字をリアクションしているユーザーを取得する
 * @param _messageId 調べたいメッセージId
 * @param _emojiCode リアクションしたユーザーを調べる絵文字コード
 * @param _cursor 取得する開始位置、３０人ごとに区切られている
 * @returns 
 */
export default async function GET_MESSAGE_WHO_REACTED(
  _messageId: string,
  _emojiCode: string,
  _cursor: number = 1
): Promise<{
  message: "Fetched reactions",
  data: string[]
}> {
  const res = await fetch(`/api/message/who-reacted?messageId=${_messageId}&emojiCode=${_emojiCode}&cursor=${_cursor}`, {
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
