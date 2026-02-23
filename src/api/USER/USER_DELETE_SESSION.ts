export default async function DELETE_USER_SESSION(_sessionId: number): Promise<{
  message: "Session removed";
  data: {
    sessionId: number;
  }
}> {
  const res = await fetch(`/api/user/session`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: _sessionId,
    }),
  }).catch((err) => {
    throw new Error("DELETE_USER_SESSION :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
