export default async function POST_NOTIFICATION_MUTE_CHANNEL(
  _channelId: string,
): Promise<{
  message: "Channel muted";
  data: { userId: string; channelId: string; mutedAt: string };
}> {
  const res = await fetch("/api/notification/mute-channel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId: _channelId }),
  }).catch((err) => {
    throw new Error("NOTIFICATION_MUTE_CHANNEL :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
