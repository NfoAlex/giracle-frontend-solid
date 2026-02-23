export default async function POST_USER_CHANGE_SESSION_NAME(_sessionId: number, _name: string): Promise<{
  message: "Session name updated";
  data: {
    id: number;
    name: string;
    userId: string;
    thisIsYou: boolean;
    createdAt: Date;
  };
}> {
  const res = await fetch(`/api/user/change-session-name`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sessionId: _sessionId,
      name: _name
    })
  }).catch((err) => {
    throw new Error("USER_SESSION :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
