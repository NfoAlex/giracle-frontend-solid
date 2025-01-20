import type { IRole } from "~/types/Role";

export default async function POST_ROLE_UPDATE(
  _roleId: string,
  _roleData: IRole,
): Promise<{
  message: `Channel created`;
  data: {
    channelId: string
  };
}> {
  const res = await fetch("/api/role/update", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      roleId: _roleId,
      roleData: _roleData,
    }),
  }).catch((err) => {
    throw new Error("ROLE_UPDATE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
