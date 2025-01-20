export default async function DELETE_ROLE_DELETE(
  _roleId: string,
): Promise<{
  message: "Role deleted";
  data: string;
}> {
  const res = await fetch("/api/role/delete", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roleId: _roleId,
    }),
  }).catch((err) => {
    throw new Error("ROLE_DELETE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
