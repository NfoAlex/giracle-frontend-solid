import type {ICustomEmoji} from "~/types/Message.ts";
import {updateCustomEmoji} from "~/stores/CustomEmoji.ts";

export default function WSCustomEmojiUploaded(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiUploaded :: dat->", dat);

  updateCustomEmoji(dat);
}