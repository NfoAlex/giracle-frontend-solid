import type { Emoji } from "emoji-picker-element/shared";
import { createSignal, createMemo, onMount } from "solid-js";
import { emojiDB } from "~/stores/CustomEmoji";

export default function RenderEmoji(props: { emojiCode: string }) {
  const [emojiData, setEmojiData] = createSignal<Emoji | null>(null);

  onMount(async () => {
    //データ取得して格納
    const _emojiData = await emojiDB.getEmojiByShortcode(props.emojiCode);
    setEmojiData(_emojiData);
  });

  // createMemoを使って絵文字表示用データを効率的に導出
  const emojiDisplay = createMemo(() => {
    const data = emojiData();
    
    // データがない場合
    if (data === null) {
      return {
        type: 'loading',
        content: props.emojiCode.slice(0, 5)
      };
    }
    
    // カスタム絵文字（URL付き）
    if (data.url !== undefined) {
      return {
        type: 'custom',
        url: data.url,
        alt: props.emojiCode
      };
    }
    
    // ユニコード絵文字
    return {
      type: 'unicode',
      unicode: data.unicode
    };
  });

  return (
    <div class="max-w-7 h-6 overflow-x-hidden">
      {emojiDisplay().type === 'loading' ? (
        <span class="w-4 overflow-x-hidden">{emojiDisplay().content}</span>
      ) : emojiDisplay().type === 'custom' ? (
        <img
          src={emojiDisplay().url}
          alt={emojiDisplay().alt}
          class="w-6 h-6"
        />
      ) : (
        <span class="h-6" style="font-size:18px;">{emojiDisplay().unicode}</span>
      )}
    </div>
  );
}