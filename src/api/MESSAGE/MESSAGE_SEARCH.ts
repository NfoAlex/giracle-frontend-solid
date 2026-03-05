import type {IMessage} from "~/types/Message.ts";

export default async function GET_MESSAGE_SEARCH(dat: {
  _content?: string,
  _channelId?: string,
  _userId?: string,
  _hasUrlPreview?: boolean,
  _hasFileAttachment?: boolean,
  _loadIndex?: number,
  _sort?: "asc" | "desc",
}): Promise<{
  message: `Searched messages`;
  data: IMessage[];
}> {
  //検索クエリー構成
  const query = new URLSearchParams();
  if (dat._content) query.set("content", dat._content);
  if (dat._channelId) query.set("channelId", dat._channelId);
  if (dat._userId) query.set("userId", dat._userId);
  if (dat._hasUrlPreview !== undefined) query.set("hasUrlPreview", String(dat._hasUrlPreview));
  if (dat._hasFileAttachment !== undefined) query.set("hasFileAttachment", String(dat._hasFileAttachment));
  if (dat._loadIndex !== undefined) query.set("loadIndex", String(dat._loadIndex));
  if (dat._sort) query.set("sort", dat._sort);

  let res: Response;
  try {
    res = await fetch(`/api/message/search?${query.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    throw new Error(`MESSAGE_SEARCH :: err-> ${String(err)}`);
  }

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
