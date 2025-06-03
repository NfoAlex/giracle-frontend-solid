import type { IMessage } from "~/types/Message";

export default async function POST_CHANNEL_GET_HISTORY(
  _channelId: string,
  _messageIdFrom?: string | undefined,
  _messageTimeFrom?: string | undefined,
  _fetchLength?: number | undefined,
  _fetchDirection?: "older" | "newer" | undefined,
): Promise<{
  message: "History fetched";
  data: {
    history: IMessage[];
    ImageDimensions: {
      [fileId: string]: {
        width: number;
        height: number;
      };
    };
    atTop: boolean;
    atEnd: boolean;
  };
}> {
  const res = await fetch(`/api/channel/get-history/${_channelId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messageIdFrom: _messageIdFrom ? _messageIdFrom : undefined,
      messageTimeFrom: _messageTimeFrom ? _messageTimeFrom : undefined,
      fetchLength: _fetchLength ? _fetchLength : undefined,
      fetchDirection: _fetchDirection ? _fetchDirection : undefined,
    }),
  }).catch((err) => {
    throw new Error("CHANNEL_GET_INFO :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
