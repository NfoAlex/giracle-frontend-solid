import { useStoreCustomEmoji } from "~/stores/CustomEmoji.store.ts";
import type { ICustomEmoji } from "~/types/Message.ts";

export default function WSCustomEmojiUploaded(dat: ICustomEmoji) {
  //console.log("WSCustomEmojiUploaded :: dat->", dat);

  useStoreCustomEmoji.updateCustomEmoji(dat);
}
