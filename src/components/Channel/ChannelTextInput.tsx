import { createSignal } from "solid-js";
import { TextField, TextFieldInput } from "../ui/text-field";
import { Button } from "../ui/button";
import { useParams } from "@solidjs/router";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND";
import {IconUpload} from "@tabler/icons-solidjs";

export default function ChannelTextInput() {
  const params = useParams();
  const [text, setText] = createSignal("");
  const [fileInput, setFileInput] = createSignal<File[]>([]);

  const sendMsg = () => {
    console.log("ChannelTextInput :: sendMsg : params.id->", {...params});

    POST_MESSAGE_SEND(params.channelId, text(), [])
      .then((r) => {
        console.log("POST_MESSAGE_SEND :: r->", r);
        setText("");
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });
  }

  /**
   * ファイル選択ダイアログを開く
   */
  const bindFiles = () => {
    const fileInputEl = document.getElementById("fileInput") as HTMLInputElement;
    fileInputEl.click();
    fileInputEl.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setFileInput([...files]);
        console.log("ChannelTextInput :: bindFiles : fileInput->", fileInput());
      }
    }
  }

  const receiveFiles = (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (items) {
      const files = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].kind === "file") {
          const file = items[i].getAsFile();
          if (file) {
            files.push(file);
          }
        }
      }
      setFileInput([...fileInput(), ...files]);
      console.log("ChannelTextInput :: receiveFiles : fileInput->", fileInput());
    }
  }

  return (
    <div class="flex items-center gap-1">
      <input type={"file"} id={"fileInput"} class={"hidden"} />

      <Button onClick={bindFiles} variant={"secondary"}><IconUpload /></Button>
      <TextField class="grow">
        <TextFieldInput
          type="text"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          onKeyDown={(e) => {e.key === "Enter" && sendMsg()}}
          onPaste={(e) => receiveFiles(e)}
        />
      </TextField>
      <Button onClick={sendMsg}>送信</Button>
    </div>
  );
}
