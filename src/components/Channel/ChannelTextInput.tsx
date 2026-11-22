import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import { createSignal, For, Show } from "solid-js";
import { api } from "~/api/index.ts";
import GiracleTextinput, {
  type GiracleTextinputHandle,
} from "~/components/unique/GiracleTextinput/index.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.store.ts";
import storeReplyingMessageId from "~/stores/ReplyingMessageId.store.ts";
import { Button } from "../ui/button.tsx";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview.tsx";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay.tsx";

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルIDの配列
  const pushFileIds = (fileId: string) => {
    //ファイルIDを追加するようの関数
    setFileIds([...fileIds(), fileId]);
  };
  const [fileInput, setFileInput] = createSignal<File[]>([]); //ファイル選択ダイアログからのファイル入力受け取り用配列
  let textinputHandle: GiracleTextinputHandle | undefined;

  const sendMsg = (text: string) => {
    //空メッセージは送信しない
    if (text.trim() === "" && fileIds().length === 0) return;

    api.message
      .send({
        channelId: params.channelId,
        message: text,
        fileIds: fileIds(),
        replyingMessageId:
          storeReplyingMessageId[params.channelId] || undefined,
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });

    //初期化処理
    setFileIds([]);
    setFileInput([]);
    delete storeReplyingMessageId[params.channelId];
  };

  /**
   * ファイル選択ダイアログを開く
   */
  const bindFiles = () => {
    const fileInputEl = document.getElementById(
      "fileInput",
    ) as HTMLInputElement;
    fileInputEl.click();
    fileInputEl.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) {
        setFileInput([...fileInput(), ...files]);
      }
    };
  };

  /**
   * ファイル用のデータ群から特定のファイル分を削る
   * @param fileId
   */
  const removeFileId = (fileId: string, fileName: string) => {
    setFileInput(fileInput().filter((f) => f.name !== fileName));
    setFileIds(fileIds().filter((id) => id !== fileId));
  };

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
                    onRemove={(fileId, fileName) => {
                      removeFileId(fileId, fileName);
                    }}
                  />
                </div>
              );
            }}
          </For>
        </div>
        <hr />
      </Show>

      {/* 返信先のメッセージデータ表示 */}
      <Show when={storeReplyingMessageId[params.channelId] !== undefined}>
        <ReplyMessageDisplay
          messageId={storeReplyingMessageId[params.channelId]}
          onRemove={() => delete storeReplyingMessageId[params.channelId]}
          channelId={params.channelId}
        />
      </Show>

      <div class="w-full relative flex items-center gap-1">
        <input type={"file"} id={"fileInput"} class={"hidden"} />

        <Button
          onClick={bindFiles}
          variant={"secondary"}
          size={"icon"}
          class="shrink-0"
        >
          <IconUpload />
        </Button>

        <div class="shrink min-w-0 grow">
          <GiracleTextinput
            channelId={params.channelId}
            onEnter={(text) => sendMsg(text)}
            onPasteFiles={(files) => setFileInput([...fileInput(), ...files])}
            sendWithCtrlKey={() => storeClientConfig.chat.sendWithCtrlKey}
            canSendEmpty={() => fileIds().length > 0}
            ref={(handle) => {
              textinputHandle = handle;
            }}
          />
        </div>

        <Button
          onClick={() => {
            const text = textinputHandle?.getText() ?? "";
            if (text.trim() === "" && fileIds().length === 0) return;
            sendMsg(text);
            textinputHandle?.clear();
            textinputHandle?.focus();
          }}
          size={"icon"}
          class={"shrink-0"}
        >
          <IconSend />
        </Button>
      </div>
    </div>
  );
}
