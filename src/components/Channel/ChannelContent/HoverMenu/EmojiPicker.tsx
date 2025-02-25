import "emoji-picker-element";
import {onCleanup, onMount} from "solid-js";
import {Picker} from "emoji-picker-element";
import {EmojiClickEvent} from "emoji-picker-element/shared";
import ja from 'emoji-picker-element/i18n/ja';

export default function EmojiPicker() {
  const picker = new Picker({
    locale: "ja",
    i18n: ja
  });

  const emojiClickHandler = (event: EmojiClickEvent) => {
    console.log("EmojiPicker :: onMount : クリックしたやつ->", event.detail);
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