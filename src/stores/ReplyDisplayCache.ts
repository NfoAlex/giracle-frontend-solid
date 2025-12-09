import { createMutable } from "solid-js/store";
import type { IMessage } from "~/types/Message.ts";

//返信表示用のキャッシュ
export const storeReplyDisplayCache = createMutable<
  { 
    cache: {
      [messageId: string]: IMessage
    } ,
    isDeleted: {
      [messageId: string]: boolean
    }
  }
>({ cache: {}, isDeleted: {} });