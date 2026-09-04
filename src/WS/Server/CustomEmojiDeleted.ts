import { useStoreCustomEmoji } from "~/stores/CustomEmoji.store.ts";
import type { ICustomEmoji } from "~/types/Message.ts";

export default function WSCustomEmojiDeleted(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiDeleted :: dat->", dat);

  //カスタム絵文字データを削除
  useStoreCustomEmoji.deleteCustomEmojiData(dat.code);
}
