import {createSignal, onCleanup, onMount} from "solid-js";
import {Picker} from "emoji-picker-element";
import type {EmojiClickEvent} from "emoji-picker-element/shared.ts";
import ja from 'emoji-picker-element/i18n/ja.js';
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION.ts";
import type {IMessage} from "~/types/Message.ts";
import {getEmojiDatasetWithCustomEmoji} from "~/stores/CustomEmoji.ts";
import DELETE_MESSAGE_DELETE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_DELETE_EMOJI_REACTION.ts";

export default function EmojiPicker(props: {message: IMessage, onClicked: () => void}) {
  let elementRef: HTMLDivElement | undefined;
  const [onUpperHalf, setOnUpperHalf] = createSignal(false);
  const [shiftPressed, setShiftPressed] = createSignal(false);

  const picker = new Picker({
    customCategorySorting: (a, b) => {
      if (a === "Custom") return 1;
      return -1;
    },
    locale: "ja",
    i18n: ja,
    customEmoji: [...getEmojiDatasetWithCustomEmoji()],
  });

  /**
   * 絵文字クリック時のハンドラ
   * @param event
   */
  const emojiClickHandler = async (event: EmojiClickEvent) => {
    //console.log("EmojiPicker :: onMount : クリックしたやつ->", event.detail);

    //絵文字コードを取得、無ければ停止
    const emojiCode = event.detail.emoji.shortcodes;
    if (emojiCode === undefined) return;

    //自分のリアクションを抜き出し
    const currentMyReaction = props.message.reactionSummary.filter(reaction => reaction.includingYou);

    //もし対象メッセージに自分からの同じ絵文字コードによるリアクションがあるのなら削除、違うならリアクション
    if (currentMyReaction.some((reaction) => reaction.emojiCode === emojiCode[0])) {
      //削除
      DELETE_MESSAGE_DELETE_EMOJI_REACTION(props.message.id, props.message.channelId, emojiCode[0])
        .catch((e) => console.error("EmojiPicker :: emojiClickHandler(DELETE_MESSAGE_DELETE_EMOJI_REACTION) : e->", e));
    } else {

      //自分のが１０個以上あるなら停止
      if (currentMyReaction.length >= 10) {
        alert("同一ユーザーによるリアクションは10個までです。");
        return;
      }

      //リアクション
      POST_MESSAGE_EMOJI_REACTION(props.message.id, props.message.channelId, emojiCode[0])
        .catch((e) => {
          console.error("EmojiPicker :: emojiClickHandler(POST_MESSAGE_EMOJI_REACTION) : e->", e)
        });
    }


    //Shiftキーが押されていたら閉じない
    if (!shiftPressed()) {
      props.onClicked();
    }
  }


  //Shiftキー押下時のハンドラ
  const shiftDownHandler = (e: KeyboardEvent) => {
    if (e.key === "Shift") setShiftPressed(true);
  }
  const shiftUpHandler = (e: KeyboardEvent) => {
    if (e.key === "Shift") setShiftPressed(false);
  }

  onMount(() => {
    //console.log("EmojiPicker :: onMount : emoji-picker-element", Picker);

    //絵文字ピッカー表示位置のための要素の高さ取得
    if (elementRef) {
      //console.log("EmojiPicker :: onMount : elementRef.getBoundingClientRect().height->", elementRef.getBoundingClientRect().top);
      setOnUpperHalf(Math.abs(elementRef.getBoundingClientRect().top) < window.innerHeight / 2);
    }

    //絵文字ピッカーをマウント
    const emojiPickerDiv = document.getElementById("emojiPickerDiv");
    if (emojiPickerDiv) {
      emojiPickerDiv.appendChild(picker);

      //スタイル適用
      const htmlTheme: string = document.querySelector("html")?.style.getPropertyValue("color-scheme") as string; //テーマ取得
      picker.style.setProperty("--background", htmlTheme==="light" ? "white" : "black"); //テーマに合わせた背景色
      picker.style.setProperty("--border-radius", "0.5rem");
      picker.style.setProperty("max-width", "90vw");
      picker.style.setProperty("--border-size", "1.5px");

      //絵文字クリックしたときのハンドラリンク
      picker.addEventListener('emoji-click', emojiClickHandler);
    }

    //Shiftキー押下時のハンドラリンク
    window.addEventListener('keydown', shiftDownHandler);
    window.addEventListener('keyup', shiftUpHandler);
  });

  onCleanup(() => {
    picker.removeEventListener('emoji-click', emojiClickHandler);
    window.removeEventListener('keydown', shiftDownHandler);
    window.removeEventListener('keyup', shiftUpHandler);
  });

  return (
    <>
      {/* 絵文字ピッカー外すべてを覆うspan、クリックで絵文字ピッカー閉じる用 */}
      <span
        onclick={props.onClicked}
        class={"z-10 fixed w-screen h-screen border-2 top-0 left-0"}
      />
      {/* 絵文字ピッカー */}
      <div
        id={"emojiPickerDiv"}
        ref={elementRef}
        class={`z-50 absolute ${onUpperHalf() ? "top-full" : "bottom-full"} right-0`}
        style={"max-height: 50vh;"}
      >
      </div>
    </>
  )
}
