import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import { createSignal, For, Show } from "solid-js";
import { api } from "~/api/index.ts";
import type {
  IQuillInputApi,
  IQuillInputTrigger,
} from "~/components/unique/QuillInput/types.ts";
import QuillInput from "~/components/unique/QuillInput.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.store.ts";
import storeReplyingMessageId from "~/stores/ReplyingMessageId.store.ts";
import { Button } from "../ui/button.tsx";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview.tsx";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay.tsx";

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  let inputApi: IQuillInputApi | undefined; //入力欄の操作API
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルIDの配列
  const pushFileIds = (fileId: string) => {
    //ファイルIDを追加するようの関数
    setFileIds([...fileIds(), fileId]);
  };
  const [fileInput, setFileInput] = createSignal<File[]>([]); //ファイル選択ダイアログからのファイル入力受け取り用配列

  /**
   * メンション入力のトリガー定義
   * トリガーを増やす場合はこの配列に 1 要素足すだけでよい
   */
  const triggers: IQuillInputTrigger[] = [
    {
      trigger: "@",
      search: async (query) => {
        const r = await api.user.list({
          username: query,
          joinedChannel: params.channelId,
        });
        return r.data.map((u) => ({
          id: u.id,
          name: u.name,
          avatarUrl: `/api/user/icon/${u.id}`,
        }));
      },
    },
  ];

  const sendMsg = (message = inputApi?.getText() ?? "") => {
    //空メッセージは送信しない
    if (message.trim() === "" && fileIds().length === 0) return;

    api.message
      .send({
        channelId: params.channelId,
        message,
        fileIds: fileIds(),
        replyingMessageId:
          storeReplyingMessageId[params.channelId] || undefined,
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });

    //送信ボタンを押されたことを考慮しフォーカスをテキスト入力へ移す（あとスマホ用）
    inputApi?.focus();
    //初期化処理
    inputApi?.clear();
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

        <QuillInput
          id={"messageInput"}
          ref={(api) => {
            inputApi = api;
          }}
          class={"shrink min-w-0 grow border rounded-md bg-background"}
          triggers={triggers}
          submitWithCtrlKey={storeClientConfig.chat.sendWithCtrlKey}
          onSubmit={sendMsg}
          onPasteFiles={(files) => setFileInput([...fileInput(), ...files])}
        />

        <Button onClick={() => sendMsg()} size={"icon"} class={"shrink-0"}>
          <IconSend />
        </Button>
      </div>
    </div>
  );
}
