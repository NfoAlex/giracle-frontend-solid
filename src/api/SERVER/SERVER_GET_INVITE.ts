export default async function GET_SERVER_GET_INVITE() {
  const res = await fetch("/api/server/get-invite", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  }).catch((err) => {
    throw new Error("SERVER_GET_INVITE :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
