import {Card} from "~/components/ui/card";
import {Button} from "~/components/ui/button";
import {IconCancel, IconCheck} from "@tabler/icons-solidjs";
import {createSignal, onMount} from "solid-js";
import {TextField, TextFieldTextArea} from "~/components/ui/text-field";
import POST_MESSAGE_EDIT from "~/api/MESSAGE/MESSAGE_EDIT";

export default function EditMessage(props: { messageId: string, content: string, onCancelEdit: () => void }) {
  const [messageContent, setMessageContent] = createSignal(props.content);
  const [processing, setProcessing] = createSignal(false);

  //マウント時にフォーカスさせる
  onMount(() => {
    document.getElementById("EditMessage")?.focus();
  });

  /**
   * メッセージを編集する
   */
  const updateMessage = async () => {
    setProcessing(true);
    console.log("EditMessage :: updateMessage : messageContent->", props.messageId, messageContent());
    await POST_MESSAGE_EDIT(props.messageId, messageContent())
      .then(() => {
        setProcessing(false);
        props.onCancelEdit();
      })
      .catch((e) => {
        console.error("POST_MESSAGE_EDIT :: e->", e);
        //alert("メッセージの編集に失敗しました. エラー: " + e);
        setProcessing(false);
      });
  }

  return (
    <Card class={"p-2 flex flex-col gap-2"}>
      <div>
        <TextField>
          <TextFieldTextArea
            id={"EditMessage"}
            value={messageContent()}
            onInput={(e) => setMessageContent(e.currentTarget.value)}
            class={"h-fit text-wrap shrink whitespace-pre-wrap break-all"}
            rows={1}
            disabled={processing()}
            autofocus
            autoResize
            placeholder={props.content.slice(0,5) + "..."}
            onKeyDown={
              (e) => {
                switch(e.key) {
                  case "Enter": {
                    if (e.ctrlKey) {
                      updateMessage();
                    }
                    break;
                  }
                  case "Escape": {
                    props.onCancelEdit();
                    break;
                  }
                }
              }
            }
          />
        </TextField>
      </div>
      <span class={"flex items-center gap-2 justify-end"}>
        <Button
          onClick={updateMessage}
          disabled={processing()}
          size={"sm"}
        ><IconCheck />更新する</Button>
        <Button
          onClick={props.onCancelEdit}
          disabled={processing()}
          variant={"secondary"}
          size={"sm"}
        ><IconCancel />キャンセル</Button>
      </span>
    </Card>
  )
}