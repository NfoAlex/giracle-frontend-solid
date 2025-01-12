export default async function GET_MESSAGE_GET_READTIME(): Promise<{
  message: "Fetched read time";
  data: {
    userId: string;
    channelId: string;
    readTime: Date;
  }[];
}> {
  const res = await fetch("/api/message/read-time/get", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_GET_READTIME :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
