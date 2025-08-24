export default async function POST_USER_CHANGE_PASSWORD(
  _currentPassword: string,
  _newPassword: string,
): Promise<{
  message: `Password changed`;
}> {
  const res = await fetch("/api/user/change-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      currentPassword: _currentPassword,
      newPassword: _newPassword,
    }),
  }).catch((err) => {
    throw new Error("CHANGE_PASSWORD :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
