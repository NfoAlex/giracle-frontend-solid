import type { IChannel } from "~/types/Channel";

export default async function GET_CHANNEL_GET_INFO(
  _channelId: string,
): Promise<{
  message: "Channel info ready";
  data: IChannel;
}> {
  const res = await fetch(`/api/channel/get-info/${_channelId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("CHANNEL_GET_INFO :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
