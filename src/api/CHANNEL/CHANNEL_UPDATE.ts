export default async function POST_CHANNEL_UPDATE(data: {
  name?: string, description?: string, isArchived?: boolean, channelId: string
}) {
  const res = await fetch("/api/channel/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...data
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_UPDATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}