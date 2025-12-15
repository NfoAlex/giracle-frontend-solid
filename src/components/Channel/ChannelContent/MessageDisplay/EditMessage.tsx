import {Card} from "~/components/ui/card.tsx";
import {Button} from "~/components/ui/button.tsx";
import {IconCancel, IconCheck} from "@tabler/icons-solidjs";
import {createSignal, onMount} from "solid-js";
import {TextField, TextFieldTextArea} from "~/components/ui/text-field.tsx";
import POST_MESSAGE_EDIT from "~/api/MESSAGE/MESSAGE_EDIT";
import { storeClientConfig } from "~/stores/ClientConfig.ts";

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
    //console.log("EditMessage :: updateMessage : messageContent->", props.messageId, messageContent());
    await POST_MESSAGE_EDIT(props.messageId, messageContent())
      .then(() => {
        setProcessing(false);
        //メッセージ入力部分にフォーカスする
        const msgInputEl = document.getElementById("messageInput") as HTMLInputElement;
        msgInputEl?.focus();
        //キャンセル処理を行う(編集モードを抜ける)
        props.onCancelEdit();
      })
      .catch((e) => {
        console.error("POST_MESSAGE_EDIT :: e->", e);
        //alert("メッセージの編集に失敗しました. エラー: " + e);
        setProcessing(false);
      });
  }

  /**
   * 編集モードを抜け出してメッセ入力部分にフォーカスする
   */
  const escapeEdit = () => {
    //メッセージ入力部分にフォーカスする
    const msgInputEl = document.getElementById("messageInput") as HTMLInputElement;
    msgInputEl?.focus();
    //編集モードを抜ける
    props.onCancelEdit();
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
                    //もしCtrlキーでの送信をオンにしているならCtrlキーで編集するようにする
                    if (storeClientConfig.chat.sendWithCtrlKey && !e.ctrlKey) break;
                    //Shiftキーでの改行用の条件を挟む
                    if (!e.shiftKey) {
                      if (messageContent() !== props.content) {
                        updateMessage();
                      } else {
                        escapeEdit();
                        break;
                      }
                    }
                    break;
                  }
                  case "Escape": {
                    escapeEdit();
                    break;
                  }
                }
              }
            }
          />
        </TextField>
      </div>
      <span class={"flex items-center gap-2 justify-end"}>
        <div class={"shrink mr-auto py-1 hidden sm:flex items-center gap-4 text-sm overflow-x-scroll"}>
          <span class={"shrink-0 flex items-center gap-1"}>
            { storeClientConfig.chat.sendWithCtrlKey && <kbd class={"border p-1 rounded"}>Ctrl</kbd> }
            <kbd class={"border p-1 rounded"}>Enter</kbd>で更新
          </span>
          <span class={"shrink-0"}>
            <kbd class={"border py-1 px-2 rounded"}>Esc</kbd>でキャンセル
          </span>
        </div>

        <Button
          onClick={updateMessage}
          disabled={processing()}
          size={"sm"}
          class={"grow sm:grow-0"}
        ><IconCheck/>更新する</Button>
        <Button
          onClick={props.onCancelEdit}
          disabled={processing()}
          variant={"secondary"}
          size={"sm"}
          class={"grow sm:grow-0"}
        ><IconCancel/>キャンセル</Button>
      </span>
    </Card>
  )
}