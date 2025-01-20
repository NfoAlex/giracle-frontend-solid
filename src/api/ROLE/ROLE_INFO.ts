import type { IRole } from "~/types/Role";

export async function GET_ROLE(_roleId: string): Promise<{
  message: "Role info",
  data: IRole
}> {
  const res = await fetch(`/api/role/${_roleId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("ROLE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
