export default function MessageTextRender(props: { content: string }) {
  return <p class="whitespace-pre-wrap break-all">{props.content}</p>;
}
