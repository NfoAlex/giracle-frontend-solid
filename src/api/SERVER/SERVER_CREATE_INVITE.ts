import type { IInvite } from "~/types/Server";

export default async function PUT_SERVER_CREATE_INVITE(
  _inviteCode: string,
  _expireDate?: Date
): Promise<{
  message: "Server invite created";
  data: IInvite;
}> {
  const res = await fetch("/api/server/create-invite", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      inviteCode: _inviteCode,
      expireDate: _expireDate,
    }),
  }).catch((err) => {
    throw new Error("SERVER_CREATE_INVITE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
