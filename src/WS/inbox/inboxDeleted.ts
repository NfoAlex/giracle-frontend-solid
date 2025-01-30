import {setStoreInbox} from "~/stores/Inbox";

export default function WSInboxDelete(dat: { type: "mention", messageId: string }) {
  setStoreInbox((prev) => {
    const _inbox = prev.filter((inboxItem) => inboxItem.Message.id !== dat.messageId);
    return [..._inbox];
  });
}