export default async function POST_ROLE_UNLINK(
  _userId: string,
  _roleId: string
): Promise<{
  message: "Role linked";
}> {
  const res = await fetch("/api/role/unlink", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: _userId,
      roleId: _roleId
    }),
  }).catch((err) => {
    throw new Error("ROLE_UNLINK :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
