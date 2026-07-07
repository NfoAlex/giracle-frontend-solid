import {type JSX, onMount} from "solid-js";
import {storeInbox} from "~/stores/Inbox.ts";
import { api } from "~/api/index.ts";

export default function MentionReadWrapper(props: {children: JSX.Element, messageId: string}) {

  onMount(() => {
    const msg = storeInbox.find((inbx) => inbx.Message.id === props.messageId);
    if (msg) {
      //console.log("MentionReadWrapper :: onMount : msg->", msg);
      api.message.inboxRead({ messageId: props.messageId }).then(() => {
        //console.log("MentionReadWrapper :: onMounted : message read");
      }).catch((e) => console.error("MentionReadWrapper :: onMounted : 既読error->", e));
    }
  });

  return (
    <>
      {props.children}
    </>
  );
}