import {setStoreInbox} from "~/stores/Inbox";
import {produce} from "solid-js/store";

export default function WSInboxDelete(dat: { type: "mention", messageId: string }) {
  setStoreInbox(produce((prev) => {
    return prev.filter((inboxItem) => inboxItem.Message.id !== dat.messageId);
  }));
}