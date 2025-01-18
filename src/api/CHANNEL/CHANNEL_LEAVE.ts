export default async function POST_CHANNEL_LEAVE(
  _channelId: string,
): Promise<{
  message: `Channel left`;
}> {
  const res = await fetch("/api/channel/leave", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_LEAVE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
