import { createStore } from "solid-js/store";
import type { IInbox } from "~/types/Message.ts";

export const [storeInbox, setStoreInbox] = createStore<IInbox[]>([]);
