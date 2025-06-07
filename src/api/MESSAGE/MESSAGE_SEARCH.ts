import type {IMessage} from "~/types/Message";

export default async function GET_MESSAGE_SEARCH(dat: {
  _content?: string,
  _channelId?: string,
  _userId?: string,
  _hasUrlPreview?: boolean,
  _hasFileAttachment?: boolean,
  _loadIndex?: number,
  _sort?: "asc" | "dsc",
}): Promise<{
  message: `Searched messages`;
  data: IMessage[];
}> {
  //検索クエリー構成
  let query = "";
  if (dat._content) query += `content=${encodeURIComponent(dat._content)}&`;
  if (dat._channelId) query += `channelId=${encodeURIComponent(dat._channelId)}&`;
  if (dat._userId) query += `userId=${encodeURIComponent(dat._userId)}&`;
  if (dat._hasUrlPreview !== undefined) query += `hasUrlPreview=${dat._hasUrlPreview}&`;
  if (dat._hasFileAttachment !== undefined) query += `hasFileAttachment=${dat._hasFileAttachment}&`;
  if (dat._loadIndex !== undefined) query += `loadIndex=${dat._loadIndex}&`;
  if (dat._sort) query += `sort=${dat._sort}&`;

  const res = await fetch(`/api/message/search?${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("MESSAGE_SEARCH :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
