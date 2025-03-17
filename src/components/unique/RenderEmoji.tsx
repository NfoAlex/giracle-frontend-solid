import type { Emoji } from "emoji-picker-element/shared";
import { createSignal, onMount, Show } from "solid-js";
import { emojiDB } from "~/stores/CustomEmoji";

export default function RenderEmoji(props: { emojiCode: string }) {
  const [emojiData, setEmojiData] = createSignal<Emoji | null>(null);

  onMount(async () => {
    //データ取得して格納
    const _emojiData = await emojiDB.getEmojiByShortcode(props.emojiCode);
    setEmojiData(_emojiData);
  });

  //絵文字データが見つかるまでは空
  if (emojiData === null) {
    return <span class="w-4 overflow-x-hidden">{ props.emojiCode.slice(0,5) }</span>
  }

  //型エラーが出ているが動作する。型エラーが出る理由は不明。
  return (
    <div class="max-w-7 h-6 overflow-x-hidden">
      <Show when={emojiData() !== null}>
        {
          emojiData().url !== undefined
          ?
          <img
            src={emojiData().url}
            alt={props.emojiCode}
            class={"w-6 h-6"}
          />
          :
          <span class="h-6" style="font-size:18px;">{ emojiData().unicode }</span>
        }
      </Show>
    </div>
  )
}