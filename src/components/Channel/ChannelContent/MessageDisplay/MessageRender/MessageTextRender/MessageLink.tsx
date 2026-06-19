import { Show } from "solid-js";
import { useLocation, useNavigate } from "@solidjs/router";
import { directGetterChannelInfo } from "~/stores/ChannelInfo";
import { fnMessageFetchCache } from "~/stores/MessageFetchCache";

/**
 * メッセージリンクを表示するコンポーネント
 * @param props
 */
export default function MessageLink(props: { channelId: string, messageId: string }) {
  const classesMessageLink = "cursor-pointer whitespace-pre-wrap break-words bg-border hover:underline my-auto mx-px align-baseline inline-flex rounded px-1";
  const classesMessageDeletedLink = "whitespace-pre-wrap break-words bg-border my-auto mx-px align-baseline inline-flex rounded px-1 text-gray-400 italic";

  const nav = useNavigate();
  const loc = useLocation();

  //すでに同じメッセージリンクを開いていた時を考慮したジャンプ関数
  const jump = (e: MouseEvent) => {
    e.preventDefault();
    if (loc.pathname.endsWith(`${props.channelId}/${props.messageId}`)) {
      nav(`/app/channel/${props.channelId}`);
      setTimeout(() => {
        nav(`/app/channel/${props.channelId}/${props.messageId}`);
      }, 0);
      return;
    }
    nav(`/app/channel/${props.channelId}/${props.messageId}`);
  };

  return (
    <Show
      when={!fnMessageFetchCache.getIsDeleted(props.messageId)}
      fallback={<span class={classesMessageDeletedLink}>削除されたメッセージ</span>}
    >
      <span onClick={jump} class={classesMessageLink}>
        #
        {
          directGetterChannelInfo(props.channelId).name.length > 18
            ?
            directGetterChannelInfo(props.channelId).name.slice(0, 18) + "..."
            :
            directGetterChannelInfo(props.channelId).name
        } のメッセージ
      </span>
    </Show>
  )
}
