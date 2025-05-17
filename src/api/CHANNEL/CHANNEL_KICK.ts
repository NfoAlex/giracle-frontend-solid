export default async function POST_CHANNEL_KICK(
  _userId: string,
  _channelId: string
): Promise<{
  message: "User kicked"
}> {
  const res = await fetch("/api/channel/kick", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: _userId,
      channelId: _channelId,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_KICK :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
