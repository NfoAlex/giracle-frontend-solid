import {onCleanup, onMount} from "solid-js";
import {Picker} from "emoji-picker-element";
import type {EmojiClickEvent} from "emoji-picker-element/shared";
import ja from 'emoji-picker-element/i18n/ja';
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION";
import type {IMessage} from "~/types/Message";

export default function EmojiPicker(props: {message: IMessage}) {
  const picker = new Picker({
    locale: "ja",
    i18n: ja
  });

  const emojiClickHandler = async (event: EmojiClickEvent) => {
    console.log("EmojiPicker :: onMount : クリックしたやつ->", event.detail);

    //絵文字コードを取得、無ければ停止
    const emojiCode = event.detail.emoji.shortcodes;
    if (emojiCode === undefined) return;
    //リアクション
    POST_MESSAGE_EMOJI_REACTION(props.message.id, props.message.channelId, emojiCode[0])
      .then((r) => {
        console.log("EmojiPicker :: emojiClickHandler : r->", r);
      })
      .catch((e) => {
        console.error("EmojiPicker :: emojiClickHandler : e->", e)
      });
  }

  onMount(() => {
    console.log("EmojiPicker :: onMount : emoji-picker-element", Picker);
    const emojiPickerDiv = document.getElementById("emojiPickerDiv");
    if (emojiPickerDiv) {
      emojiPickerDiv.appendChild(picker);

      //絵文字クリックしたときのハンドラリンク
      picker.addEventListener('emoji-click', emojiClickHandler);
    }
  });

  onCleanup(() => {
    picker.removeEventListener('emoji-click', emojiClickHandler);
  });

  return (
    <div id={"emojiPickerDiv"} class={"absolute top-0 right-0"}>
    </div>
  )
}