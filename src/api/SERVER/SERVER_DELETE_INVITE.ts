import type { IInvite } from "~/types/Server";

export default async function DELETE_SERVER_DELETE_INVITE(
  _inviteId: number,
): Promise<{
  message: "Server invite created";
  data: IInvite;
}> {
  const res = await fetch("/api/server/delete-invite", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inviteId: _inviteId,
    }),
  }).catch((err) => {
    throw new Error("SERVER_DELETE_INVITE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
