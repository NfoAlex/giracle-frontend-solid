export default async function POST_MESSAGE_INBOX_READ(
  _messageId: string,
): Promise<{
  message: `Inbox read`;
  data: string;
}> {
  const res = await fetch("/api/message/inbox/read", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId: _messageId,
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_INBOX_READ :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
