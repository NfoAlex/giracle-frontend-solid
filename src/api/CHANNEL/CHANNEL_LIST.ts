import type { IChannel } from "~/types/Channel.ts";

export async function GET_CHANNEL_LIST(): Promise<{
  message: "Channel list ready",
  data: IChannel[]
}> {
  const res = await fetch("/api/channel/list", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("CHANNEL_LIST :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
