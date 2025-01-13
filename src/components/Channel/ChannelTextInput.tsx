import { createSignal } from "solid-js";
import { TextField, TextFieldInput } from "../ui/text-field";
import { Button } from "../ui/button";
import { useLocation, useParams } from "@solidjs/router";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND";

export default function ChannelTextInput() {
  const params = useParams();
  const [text, setText] = createSignal("");

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
  
  return (
    <div class="flex items-center">
      <TextField>
        <TextFieldInput
          type="text"
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
        />
      </TextField>
      <Button onClick={sendMsg}>送信</Button>
    </div>
  );
}
