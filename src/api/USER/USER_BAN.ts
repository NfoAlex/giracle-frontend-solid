export default async function POST_USER_BAN(
  _userId: string
): Promise<{
  message: `User banned`;
  data: string;
}> {
  const res = await fetch("/api/user/ban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: _userId
    }),
  }).catch((err) => {
    throw new Error("USER_BAN :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
