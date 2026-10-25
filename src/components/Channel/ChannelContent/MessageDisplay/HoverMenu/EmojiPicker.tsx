import {createSignal, onCleanup, onMount} from "solid-js";
import {Picker} from "emoji-picker-element";
import type {EmojiClickEvent} from "emoji-picker-element/shared.ts";
import ja from 'emoji-picker-element/i18n/ja.js';
import { api } from "~/api/index.ts";
import type {IMessage} from "~/types/Message.ts";
import {useStoreCustomEmoji} from "~/stores/CustomEmoji.store.ts";

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
    customEmoji: [...useStoreCustomEmoji.getEmojiDatasetWithCustomEmoji()],
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
      api.message.deleteEmojiReaction({ messageId: props.message.id, channelId: props.message.channelId, emojiCode: emojiCode[0] })
        .catch((e) => console.error("EmojiPicker :: emojiClickHandler(DELETE_MESSAGE_DELETE_EMOJI_REACTION) : e->", e));
    } else {

      //自分のが１０個以上あるなら停止
      if (currentMyReaction.length >= 10) {
        alert("同一ユーザーによるリアクションは10個までです。");
        return;
      }

      //リアクション
      api.message.emojiReaction({ messageId: props.message.id, channelId: props.message.channelId, emojiCode: emojiCode[0] })
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

  const applyPickerSize = () => {
    if (!elementRef) return;

    //履歴表示領域と、絶対配置の基準要素の位置を取得
    const historyRect = document.getElementById("history")?.getBoundingClientRect();
    const anchorRect = (elementRef.offsetParent as HTMLElement | null)?.getBoundingClientRect();
    if (!historyRect || !anchorRect) return;

    //履歴の上下端から8px内側を表示可能範囲とする
    const visibleTop = historyRect.top + 8;
    const visibleBottom = historyRect.bottom - 8;
    //基準要素が履歴の外にあっても、ピッカーの手前側を履歴内へ寄せる
    const belowTop = Math.max(anchorRect.bottom, visibleTop);
    const aboveBottom = Math.min(anchorRect.top, visibleBottom);
    const spaceBelow = Math.max(0, visibleBottom - belowTop);
    const spaceAbove = Math.max(0, aboveBottom - visibleTop);
    const openBelow = spaceBelow >= spaceAbove;

    setOnUpperHalf(openBelow);
    const height = Math.min(400, openBelow ? spaceBelow : spaceAbove);
    const offset = openBelow ? belowTop - anchorRect.bottom : anchorRect.top - aboveBottom;
    elementRef.style.transform = offset > 0 ? `translateY(${openBelow ? offset : -offset}px)` : "";
    picker.style.setProperty("height", `${height}px`);
    elementRef.style.maxHeight = `${height}px`;
  };

  onMount(() => {
    //console.log("EmojiPicker :: onMount : emoji-picker-element", Picker);

    //絵文字ピッカーをマウント
    const emojiPickerDiv = document.getElementById("emojiPickerDiv");
    if (emojiPickerDiv) {
      emojiPickerDiv.appendChild(picker);
      applyPickerSize();

      //スタイル適用
      const htmlTheme: string = document.querySelector("html")?.style.getPropertyValue("color-scheme") as string; //テーマ取得
      picker.style.setProperty("--background", htmlTheme==="light" ? "white" : "black"); //テーマに合わせた背景色
      picker.style.setProperty("--border-radius", "0.5rem");
      picker.style.setProperty("max-width", "90vw");
      picker.style.setProperty("--border-size", "1.5px");

      //絵文字クリックしたときのハンドラリンク
      picker.addEventListener('emoji-click', emojiClickHandler);
    }

    //ウィンドウサイズ変更時に高さと表示位置を再計算
    window.addEventListener('resize', applyPickerSize);

    //Shiftキー押下時のハンドラリンク
    window.addEventListener('keydown', shiftDownHandler);
    window.addEventListener('keyup', shiftUpHandler);
  });

  onCleanup(() => {
    picker.removeEventListener('emoji-click', emojiClickHandler);
    window.removeEventListener('resize', applyPickerSize);
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
