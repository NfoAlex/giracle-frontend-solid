import {type JSX, onMount} from "solid-js";
import {storeInbox} from "~/stores/Inbox";
import POST_MESSAGE_INBOX_READ from "~/api/MESSAGE/MESSAGE_INBOX_READ";

export default function MentionReadWrapper(props: {children: JSX.Element, messageId: string}) {

  onMount(() => {
    const msg = storeInbox.find((inbx) => inbx.Message.id === props.messageId);
    if (msg) {
      POST_MESSAGE_INBOX_READ(props.messageId).then(() => {
        console.log("MentionReadWrapper :: onMounted : message read");
      });
    }
  });

  return (
    <>
      {props.children}
    </>
  );
}