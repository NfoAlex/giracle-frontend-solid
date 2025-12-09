import type {ICustomEmoji} from "~/types/Message.ts";
import {deleteCustomEmojiData} from "~/stores/CustomEmoji.ts";

export default function WSCustomEmojiDeleted(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiDeleted :: dat->", dat);

  //カスタム絵文字データを削除
  deleteCustomEmojiData(dat.code);
}