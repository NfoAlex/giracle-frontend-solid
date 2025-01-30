import type {IInbox} from "~/types/Message";
import {createStore} from "solid-js/store";

export const [storeInbox, setStoreInbox] = createStore<IInbox[]>([]);