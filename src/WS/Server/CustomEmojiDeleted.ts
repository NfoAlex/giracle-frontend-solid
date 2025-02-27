import type {ICustomEmoji} from "~/types/Message";
import {deleteCustomEmojiData} from "~/stores/CustomEmoji";

export default function WSCustomEmojiDeleted(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiDeleted :: dat->", dat);

  //カスタム絵文字データを削除
  deleteCustomEmojiData(dat.code);
}