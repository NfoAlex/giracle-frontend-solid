import type { IServer } from "~/types/Server.ts";

export default async function POST_SERVER_CHANGE_CONFIG(
  _dat: IServer
): Promise<{
  message: "Server config updated";
  data: IServer;
}> {
  const res = await fetch("/api/server/change-config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ..._dat
    }),
  }).catch((err) => {
    throw new Error("SERVER_CHANGE_CONFIG :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
