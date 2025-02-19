import {Card} from "~/components/ui/card";
import {Button} from "~/components/ui/button";
import {IconCancel, IconCheck} from "@tabler/icons-solidjs";
import {createSignal} from "solid-js";
import {TextField, TextFieldInput, TextFieldTextArea} from "~/components/ui/text-field";

export default function EditMessage(props: { messageId: string, content: string, onCancelEdit: () => void }) {
  const [messageContent, setMessageContent] = createSignal(props.content);

  return (
    <Card class={"p-2 flex flex-col gap-2"}>
      <div>
        <TextField>
          <TextFieldTextArea
            value={messageContent()}
            onInput={(e) => setMessageContent(e.currentTarget.value)}
            class={"h-fit text-wrap shrink whitespace-pre-wrap break-all"}
            rows={1}
            autofocus
            autoResize
            placeholder={props.content.slice(0,5) + "..."}
          />
        </TextField>
      </div>
      <span class={"flex items-center gap-2 justify-end"}>
        <Button><IconCheck />更新する</Button>
        <Button onClick={props.onCancelEdit} variant={"secondary"}><IconCancel />キャンセル</Button>
      </span>
    </Card>
  )
}