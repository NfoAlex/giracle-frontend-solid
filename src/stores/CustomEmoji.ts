import {createStore} from "solid-js/store";
import {ICustomEmoji} from "~/types/Message";
import {Database} from "emoji-picker-element";

export const [storeCustomEmoji, setStoreCustomEmoji] = createStore<ICustomEmoji[]>([]);
export const emojiDB = new Database();