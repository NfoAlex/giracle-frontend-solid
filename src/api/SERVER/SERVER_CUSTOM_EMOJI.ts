export default async function GET_SERVER_CUSTOM_EMOJI(): Promise<{
  message: string;
  data: {
    id: string,
    code: string,
    uploadedUserId: string
  };
}> {
  const res = await fetch("/api/server/custom-emoji", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("SERVER_CUSTOM_EMOJI :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
