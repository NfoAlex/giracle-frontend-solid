export default async function DELETE_CHANNEL_DELETE(
  _channelId: string,
): Promise<{
  message: `Channel deleted`;
}> {
  const res = await fetch("/api/channel/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_DELETE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
