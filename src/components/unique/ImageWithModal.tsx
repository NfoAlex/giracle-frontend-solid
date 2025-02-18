import {createSignal} from "solid-js";
import { Dialog as KDialog } from "@kobalte/core/dialog";

/**
 * img要素として使うことができクリックするとモーダルとして拡大もできるコンポーネント。
 * @param props - {class: 適用したいCSSのクラス, src: 画像のURL}
 */
export default function ImageWithModal(props: { class: string, src: string }) {
  const [isOpen, setIsOpen] = createSignal(false);

  return (
    <>
      <img onClick={() => setIsOpen(true)} src={props.src} class={`${props.class} cursor-pointer`} alt={props.src.length > 30 ? props.src.slice(0,15) + "..." : props.src}/>
      <KDialog open={isOpen()} onOpenChange={setIsOpen}>
        <KDialog.Portal>
          <div onClick={()=>setIsOpen(false)} class={"inset-0 z-50 p-2 fixed flex justify-center items-center w-full h-full bg-black bg-opacity-50"}>
            <KDialog.Content class={"h-4/5 w-10/12 flex justify-center items-center"}>
              <img
                src={props.src}
                class={`max-w-full max-h-full shrink cursor-pointer`}
                alt={props.src.length > 30 ? props.src.slice(0,15) + "..." : props.src}
              />
            </KDialog.Content>
          </div>
        </KDialog.Portal>
      </KDialog>
    </>
  )
}