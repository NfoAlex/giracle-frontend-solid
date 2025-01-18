export default async function PUT_CHANNEL_CREATE(
  _channelName: string,
  _description: string,
): Promise<{
  message: `Channel created`;
  data: {
    channelId: string
  };
}> {
  const res = await fetch("/api/channel/create", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelName: _channelName,
      description: _description,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_CREATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
