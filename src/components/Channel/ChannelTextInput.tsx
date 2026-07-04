import { createSignal, For, Show } from "solid-js";
import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND.ts";
import storeReplyingMessageId from "~/stores/ReplyingMessageId.ts";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.ts";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay.tsx";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview.tsx";
import { Button } from "../ui/button.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import RichTextInput from "~/components/unique/RichTextInput/index.tsx";
import type { RichTextInputApi } from "~/components/unique/RichTextInput/types.ts";

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルIDの配列
  const pushFileIds = (fileId: string) => { //ファイルIDを追加するようの関数
    setFileIds([...fileIds(), fileId]);
    console.log("ChannelTextInput :: pushFileIds : fileId->", fileId, fileIds());
  }
  const [fileInput, setFileInput] = createSignal<File[]>([]); //ファイル選択ダイアログからのファイル入力受け取り用配列
  let richTextApi: RichTextInputApi | undefined; //RichTextInputの命令的API

  const sendMsg = (raw: string) => {
    //console.log("ChannelTextInput :: sendMsg : params.id->", {...params});

    //空メッセージは送信しない
    if (raw.trim() === "" && fileIds().length === 0) return;

    POST_MESSAGE_SEND(params.channelId!, raw, fileIds(), storeReplyingMessageId[params.channelId!] || undefined)
      .then(() => {
        //console.log("POST_MESSAGE_SEND :: r->", r);
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });

    //送信ボタンを押されたことを考慮しフォーカスをテキスト入力へ移す（あとスマホ用）
    richTextApi?.clear();
    richTextApi?.focus();
    //初期化処理
    setFileIds([]);
    setFileInput([]);
    delete storeReplyingMessageId[params.channelId!];
  }

  /**
   * Enter送信の可否判定(Ctrl+Enter設定用。Shift+Enter改行/IME対応はRichTextInput側で処理済み)
   */
  const shouldSubmit = (e: KeyboardEvent): boolean => {
    if (e.shiftKey) return false;
    if (storeClientConfig.chat.sendWithCtrlKey && !e.ctrlKey) return false;
    return true;
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
        console.log("ChannelTextInput :: bindFiles : files->", files);
        setFileInput([...fileInput(), ...files]);
        //console.log("ChannelTextInput :: bindFiles : fileInput->", fileInput());
      }
    }
  }

  /**
   * ペーストイベントからのファイルを受け取る
   * @param event
   */
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
      //console.log("ChannelTextInput :: receiveFiles : fileInput->", fileInput());
    }
  }

  /**
   * ファイル用のデータ群から特定のファイル分を削る
   * @param fileId
   */
  const removeFileId = (fileId: string, fileName: string) => {
    setFileInput(fileInput().filter(f=>f.name!==fileName));
    setFileIds(fileIds().filter(id => id !== fileId));
  }

  return (
    <div class={"flex flex-col gap-2 pb-1"}>
      {/* ファイルアップロードプレビュー表示部 */}
      <Show when={fileInput().length > 0}>
        <div class={"flex items-center overflow-x-auto gap-1"}>
          <For each={fileInput()}>
            {(file) => {
              return (
                <div class={"w-fit flex items-center"}>
                  <FileUploadPreview
                    file={file}
                    dataSetter={pushFileIds}
                    onRemove={(fileId, fileName)=>{ removeFileId(fileId, fileName) }}
                  />
                </div>
              );
            }}
          </For>
        </div>
        <hr />
      </Show>

      {/* 返信先のメッセージデータ表示 */}
      <Show when={storeReplyingMessageId[params.channelId!] !== undefined}>
        <ReplyMessageDisplay
          messageId={storeReplyingMessageId[params.channelId!]}
          onRemove={() => delete storeReplyingMessageId[params.channelId!]}
          channelId={params.channelId!}
        />
      </Show>

      <div class="w-full relative flex items-center gap-1">
        <input type={"file"} id={"fileInput"} class={"hidden"} />

        <Button onClick={bindFiles} variant={"secondary"} size={"icon"} class="shrink-0"><IconUpload /></Button>

        <RichTextInput
          placeholder={"メッセージを送信"}
          shouldSubmit={shouldSubmit}
          onEnter={sendMsg}
          mentionSearch={(query) => GET_USER_SEARCH(query, params.channelId!).then((r) => r.data)}
          onPaste={(e) => receiveFiles(e)}
          ref={(api) => { richTextApi = api; }}
        />

        <Button onClick={() => sendMsg(richTextApi?.getRaw() ?? "")} size={"icon"} class={"shrink-0"}><IconSend /></Button>
      </div>
    </div>
  );
}
