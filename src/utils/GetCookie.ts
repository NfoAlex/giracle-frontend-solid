export default function GetCookie(name: string): string | undefined {
  const cookieArr = document.cookie.split(";");
  let cookieValue: undefined | string;
  for (const c of cookieArr) {
    if (c.startsWith(`${name}=`) || c.startsWith(` ${name}=`)) {
      cookieValue = c.split(`${name}=`)[1];
    }
  }

  return cookieValue;
}
