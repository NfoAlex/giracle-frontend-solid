export default async function POST_CHANNEL_JOIN(
  _channelId: string,
): Promise<{
  message: `Channel joined`;
  data: {
    channelId: string
  };
}> {
  const res = await fetch("/api/channel/join", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_JOIN :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
