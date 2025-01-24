export default async function POST_MESSAGE_FILE_UPLOAD(_channelId: string, _file: File):Promise<{
  message: `File uploaded`;
  data: {
    fileId: string
  };
}> {
  const res = await fetch("/api/message/file/upload", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      channelId: _channelId,
      file: _file
    }),
  }).catch((err) => {
    throw new Error("MESSAGE_FILE_UPLOAD :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}