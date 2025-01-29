export default function GetCookie(name: string): string | undefined {
  const cookirArr = document.cookie.split(";");
  let cookieValue: undefined | string;
  for (const c of cookirArr) {
    if (c.startsWith(`${name}=`) || c.startsWith(` ${name}=`)) {
      cookieValue = c.split(`${name}=`)[1];
    }
  }

  return cookieValue;
}
