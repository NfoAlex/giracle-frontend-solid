import {setStoreInbox} from "~/stores/Inbox";
import {produce} from "solid-js/store";
import type {IInbox, IMessage} from "~/types/Message";

export default function WSInboxAdded(dat: { type: IInbox["type"], message: IMessage }) {
  setStoreInbox((prev) => {
    const newItem: IInbox = {
      messageId: dat.message.id,
      type: "mention",
      userId: "",
      Message: dat.message,
      happendAt: dat.message.createdAt
    }
    return [...prev, newItem];
  });
}