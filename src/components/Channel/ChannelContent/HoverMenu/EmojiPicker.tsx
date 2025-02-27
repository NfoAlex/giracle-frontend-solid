import {createSignal, onCleanup, onMount} from "solid-js";
import {Picker} from "emoji-picker-element";
import type {EmojiClickEvent} from "emoji-picker-element/shared";
import ja from 'emoji-picker-element/i18n/ja';
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION";
import type {IMessage} from "~/types/Message";
import {getEmojiDatasetWithCustomEmoji} from "~/stores/CustomEmoji";

export default function EmojiPicker(props: {message: IMessage}) {
  let elementRef: HTMLDivElement | undefined;
  let [onUpperHalf, setOnUpperHalf] = createSignal(false);
  const picker = new Picker({
    locale: "ja",
    i18n: ja,
    customEmoji: [...getEmojiDatasetWithCustomEmoji()]
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

    //絵文字ピッカー表示位置のための要素の高さ取得
    if (elementRef) {
      //console.log("EmojiPicker :: onMount : elementRef.getBoundingClientRect().height->", elementRef.getBoundingClientRect().top);
      setOnUpperHalf(Math.abs(elementRef.getBoundingClientRect().top) < window.innerHeight / 2);
    }

    //絵文字ピッカーをマウント
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
    <div
      id={"emojiPickerDiv"}
      ref={elementRef}
      class={`z-50 absolute ${onUpperHalf() ? "top-full" : "bottom-full"} right-0`}
      style={"max-height: 50vh;"}
    >
    </div>
  )
}