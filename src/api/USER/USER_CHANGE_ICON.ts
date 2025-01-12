export default async function POST_USER_CHANGE_ICON(
  _icon: File,
): Promise<{ message: "Icon changed" }> {
  const formData = new FormData();
  formData.append("icon", _icon);
  const res = await fetch("/api/user/change-icon", {
    method: "POST",
    credentials: "include",
    body: formData,
  }).catch((err) => {
    throw new Error("USER_CHANGE_ICON :: err->", err);
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
