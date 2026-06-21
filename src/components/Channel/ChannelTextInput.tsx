import { createMemo, createSignal, For, Match, Show, Switch as SolidSwitch } from "solid-js";
import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND.ts";
import storeReplyingMessageId from "~/stores/ReplyingMessageId.ts";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.ts";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay.tsx";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview.tsx";
import { Button } from "../ui/button.tsx";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Card } from "../ui/card.tsx";
import { IChannel } from "~/types/Channel.ts";
import { IUser } from "~/types/User.ts";

interface IInputSections {
  type: "text" | "mention" | "channel" | "emoji" | "newline" | "url" | "messageLink";
  value: string;
  /** メンション用：確定済みユーザーID */
  lockedUserId?: string;
  /** メンション用：確定済みかどうか */
  isReady?: boolean;
}

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  const currentChannelId = createMemo(() => params.channelId ?? "");

  const [text, setText] = createSignal(""); //メッセージテキスト
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルIDの配列
  const [inputSections, setInputSections] = createSignal<IInputSections[]>([
    { type: "text", value: "" },
  ]);

  let cursorPosition = 0;

  const sendMsg = () => {
    //console.log("ChannelTextInput :: sendMsg : params.id->", {...params});

    //空メッセージは送信しない
    if (text().trim() === "" && fileIds().length === 0) return;

    POST_MESSAGE_SEND(currentChannelId(), text(), fileIds(), undefined)
      .then(() => {
        //console.log("POST_MESSAGE_SEND :: r->", r);
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });

    //送信ボタンを押されたことを考慮しフォーカスをテキスト入力へ移す（あとスマホ用）
    document.getElementById("messageInput")?.focus();
    //初期化処理
    setText("");
    setFileIds([]);
    //setFileInput([]);
    delete storeReplyingMessageId[currentChannelId()];
  }

  const Section = {
    focusToLast: () => {
      document.getElementById("MsgInput:" + (inputSections().length - 1))?.focus();
    }
  };

  const Input = {
    keyHandler: (e: KeyboardEvent) => {
      console.log("ChannelTextInput :: Input.keyHandler : e.key", e.key, { cursorPosition });
      switch (e.key) {
        case "Enter": {
          //Macなら変換での勝手な送信をブロックする
          if (/Mac/.test(navigator.userAgent) && e.isComposing) break;
          if (e.shiftKey) break;

          //設定でCtrlキーを押す必要がある場合
          if (storeClientConfig.chat.sendWithCtrlKey) {
            if (!e.ctrlKey) break;
          }

          e.preventDefault();
          //メッセージ送信
          sendMsg();
          break;
        };
        case "@": {
          //テキスト入力欄の最後のセクションを取得
          const sectionsBehind = inputSections().slice(0, cursorPosition + 1);
          const sectionsForward = inputSections().slice(cursorPosition + 1);
          setInputSections(() => {
            return [
              ...sectionsBehind,
              { type: "mention", value: "", isReady: false, lockedUserId: "", },
              ...sectionsForward
            ]
          });
          document.getElementById("MsgInput:" + (cursorPosition + 1))?.focus();
        }
      }
    }
  };

  return (
    <div class={"flex flex-col gap-2 pb-1"}>
      <div class="w-full relative flex items-center gap-1">
        <textarea
          id={"messageInput"}
          class={"shrink min-w-0 grow p-2 bg-background resize-none border rounded-md break-all h-fit whitespace-pre-wrap max-h-40"}
          rows={text().match(/\n/g)?.length === 0 ? 1 : (text().match(/\n/g)?.length ?? 0) + 1}
          value={text()}
          onInput={(e) => {
            cursorPosition = e.currentTarget?.selectionStart || 0;
            setText(e.currentTarget.value);
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case "Enter": {
                //Macなら変換での勝手な送信をブロックする
                if (/Mac/.test(navigator.userAgent) && e.isComposing) break;
                if (e.shiftKey) break;

                //設定でCtrlキーを押す必要がある場合
                if (storeClientConfig.chat.sendWithCtrlKey) {
                  if (!e.ctrlKey) break;
                }

                e.preventDefault();
                //メッセージ送信
                sendMsg();
                break;
              }
            }
          }}
        />

        <Button onClick={sendMsg} size={"icon"} class={"shrink-0"}><IconSend /></Button>
      </div>

      <div onClick={Section.focusToLast} class="border rounded cursor-text flex flex-wrap gap-1">
        <For each={inputSections()}>
          {(inp, index) => (
            <SolidSwitch>
              <Match when={inp.type === "text"}>
                <div
                  id={"MsgInput:" + index()}
                  contentEditable
                  class={`border-blue-300 border w-fit`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onFocus={() => { cursorPosition = index(); }}
                  onKeyDown={Input.keyHandler}
                />
              </Match>
              <Match when={inp.type === "mention"}>
                <div
                  id={"MsgInput:" + index()}
                  contentEditable
                  class={`border-red-300 border w-fit rounded bg-slate-500`}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  onFocus={() => { cursorPosition = index(); }}
                  onKeyDown={Input.keyHandler}
                />
              </Match>
            </SolidSwitch>)
          }
        </For>
      </div>
    </div>
  );
}
