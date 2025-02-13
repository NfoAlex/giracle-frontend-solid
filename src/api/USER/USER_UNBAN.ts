export default async function POST_USER_UNBAN(
  _userId: string
): Promise<{
  message: `User unbanned`;
  data: string;
}> {
  const res = await fetch("/api/user/unban", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: _userId
    }),
  }).catch((err) => {
    throw new Error("USER_UNBAN :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
