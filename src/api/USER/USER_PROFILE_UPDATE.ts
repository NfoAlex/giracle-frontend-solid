export default async function POST_USER_PROFILE_UPDATE(
  _name: string | undefined,
  _selfIntroduction: string | undefined,
): Promise<{
  message: `Profile updated`;
  data: {
    name: string | null;
    id: string;
    selfIntroduction: string;
  };
}> {
  const res = await fetch("/api/user/profile-update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: _name,
      selfIntroduction: _selfIntroduction,
    }),
  }).catch((err) => {
    throw new Error("PROFILE_UPDATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
