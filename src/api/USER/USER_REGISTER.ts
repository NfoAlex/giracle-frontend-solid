export default async function POST_USER_REGISTER(
  _username: string,
  _password: string,
  _inviteCode?: string,
): Promise<{
  message: "User created";
}> {
  const res = await fetch("/api/user/sign-up", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: _username,
      password: _password,
      inviteCode: _inviteCode,
    }),
  }).catch((err) => {
    throw new Error("AUTH_REGISTER :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
