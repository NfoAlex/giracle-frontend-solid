export default async function POST_CHANNEL_INVITE(
  _userId: string,
): Promise<{
  message: "User invited"
}> {
  const res = await fetch("/api/channel/invite", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: _userId,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_INVITE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
