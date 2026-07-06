export default async function POST_NOTIFICATION_UNMUTE_CHANNEL(
  _channelId: string,
): Promise<{
  message: "Channel unmuted";
  data: { channelId: string };
}> {
  const res = await fetch("/api/notification/unmute-channel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelId: _channelId }),
  }).catch((err) => {
    throw new Error("NOTIFICATION_UNMUTE_CHANNEL :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
