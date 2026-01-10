import type {IInbox} from "~/types/Message.ts";

export default async function GET_MESSAGE_INBOX(): Promise<{
  message: "Fetched inbox",
  data: IInbox[]
}> {
  const res = await fetch("/api/message/inbox", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_INBOX :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
