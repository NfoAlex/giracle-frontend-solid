import {createSignal} from "solid-js";
import { Dialog as KDialog } from "@kobalte/core/dialog";

/**
 * img要素として使うことができクリックするとモーダルとして拡大もできるコンポーネント。
 * @param props - `{class: 適用したいCSSのクラス, src: 画像のURL}`
 */
export default function ImageWithModal(props: { class: string, src: string | null, height?: number, width?: number }) {
  const [isOpen, setIsOpen] = createSignal(false);

  //URL
  const srcUrl = props.src;
  //URLが無効なら何も返さない
  if (srcUrl === null) return <></>

  return (
    <>
      {/* サムネ表示 */}
      <img
        onClick={() => setIsOpen(true)} 
        src={srcUrl}
        class={`${props.class} cursor-pointer object-contain`}
        style={`height: ${props.height}px;`}
        alt={srcUrl.length > 30 ? srcUrl.slice(0,15) + "..." : srcUrl}
      />

      {/* モーダル表示 */}
      <KDialog open={isOpen()} onOpenChange={setIsOpen}>
        <KDialog.Portal>
          <div
            onClick={()=>setIsOpen(false)}
            class={"inset-0 z-50 p-2 fixed flex justify-center items-center w-full h-full bg-black bg-opacity-50"}
          >
            <KDialog.Content
              class={"h-4/5 w-11/12 flex justify-center items-center"}
            >
              <img
                src={srcUrl}
                class={`max-w-full max-h-full shrink cursor-pointer`}
                alt={srcUrl.length > 30 ? srcUrl.slice(0,15) + "..." : srcUrl}
              />
            </KDialog.Content>
          </div>
        </KDialog.Portal>
      </KDialog>
    </>
  )
}