import type {ICustomEmoji} from "~/types/Message";
import {updateCustomEmoji} from "~/stores/CustomEmoji";

export default function WSCustomEmojiUploaded(dat: ICustomEmoji) {
  console.log("WSCustomEmojiUploaded :: dat->", dat);

  updateCustomEmoji(dat);
}