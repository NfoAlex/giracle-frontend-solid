export default async function DELETE_MESSAGE_DELETE(
  _messageId: string,
): Promise<{
  message: `Message deleted`;
  data: string;
}> {
  const res = await fetch("/api/message/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageId: _messageId
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_DELETE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
