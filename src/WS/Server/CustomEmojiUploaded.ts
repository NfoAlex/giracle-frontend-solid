import { updateCustomEmoji } from "~/stores/CustomEmoji.ts";
import type { ICustomEmoji } from "~/types/Message.ts";

export default function WSCustomEmojiUploaded(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiUploaded :: dat->", dat);

  updateCustomEmoji(dat);
}
