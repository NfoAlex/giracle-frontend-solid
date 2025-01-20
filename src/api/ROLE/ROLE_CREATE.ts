import type { IRole } from "~/types/Role";

export default async function PUT_ROLE_CREATE(
  _roleName: string
): Promise<{
  message: "Role created";
  data: IRole;
}> {
  const res = await fetch("/api/role/create", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roleName: _roleName,
      rolePower: {}
    }),
  }).catch((err) => {
    throw new Error("ROLE_CREATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
