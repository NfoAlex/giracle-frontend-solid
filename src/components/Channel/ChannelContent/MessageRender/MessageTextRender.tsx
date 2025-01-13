export default function MessageTextRender(props: { content: string }) {
  return <p class="whitespace-pre-wrap break-words">{props.content}</p>;
}
