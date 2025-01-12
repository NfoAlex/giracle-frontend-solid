export default async function POST_USER_LOGIN(
  _username: string,
  _password: string,
): Promise<{
  message: `Signed in as ${string}`;
  data: {
    userId: string;
  };
}> {
  const res = await fetch("/api/user/sign-in", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: _username,
      password: _password,
    }),
  }).catch((err) => {
    throw new Error("AUTH_LOGIN :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
