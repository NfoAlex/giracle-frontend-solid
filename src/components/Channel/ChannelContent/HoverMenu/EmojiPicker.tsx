import "emoji-picker-element";
import {onMount} from "solid-js";
import {Picker} from "emoji-picker-element";

export default function EmojiPicker() {
  const picker = new Picker();

  onMount(() => {
    console.log("EmojiPicker :: onMount : emoji-picker-element", Picker);
    const emojiPickerDiv = document.getElementById("emojiPickerDiv");
    if (emojiPickerDiv) {
      emojiPickerDiv.appendChild(picker);
    }
  });

  return (
    <div id={"emojiPickerDiv"} class={"absolute top-0 right-0"}>
    </div>
  )
}