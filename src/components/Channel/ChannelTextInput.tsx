import { createMemo, createSignal, For, Match, Show, Switch as SolidSwitch } from "solid-js";
import { useParams } from "@solidjs/router";
import { IconSend, IconUpload } from "@tabler/icons-solidjs";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND";
import storeReplyingMessageId from "~/stores/ReplyingMessageId";
import ReplyMessageDisplay from "./ChannelTextInput/ReplyMessageDisplay";
import FileUploadPreview from "./ChannelTextInput/FileUploadPreview";
import MessageTextRender from "./ChannelContent/MessageDisplay/MessageRender/MessageTextRender";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { storeClientConfig } from "~/stores/ClientConfig";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH";
import type { IUser } from "~/types/User";

interface IInputSections {
  type: "text" | "mention" | "channel" | "emoji" | "newline" | "url" | "messageLink";
  value: string;
  /** メンション用：確定済みユーザーID */
  lockedUserId?: string;
  /** メンション用：確定済みかどうか */
  isReady?: boolean;
}

export default function ChannelTextInput() {
  const params = useParams();
  const currentChannelId = createMemo(() => params.channelId ?? "");

  // --- セクション配列（ブロック分割入力） ---
  const [inputSections, setInputSections] = createSignal<IInputSections[]>([
    { type: "text", value: "" },
  ]);
  const [currentFocusIndex, setCurrentFocusIndex] = createSignal(0);

  // --- メンション検索 ---
  const [userList, setUserList] = createSignal<IUser[]>([]);

  // --- ファイル関連 ---
  const [fileIds, setFileIds] = createSignal<string[]>([]);
  const [fileInput, setFileInput] = createSignal<File[]>([]);

  const InputSection = {
    /**
     * テキスト入力値をセクションへバインド
     */
    bind: (value: string, index: number) => {
      if (inputSections()[index]?.type === "mention") {
        if (value.length >= 2) {
          InputSection.searchUser(value);
        }
      }

      setInputSections((prev) => {
        const newInputs = [...prev];
        newInputs[index] = { ...newInputs[index], value };
        return newInputs;
      });
    },

    /**
     * メンション用のユーザーIDをバインド（確定）
     */
    bindUserId: (user: IUser) => {
      const focusIdx = currentFocusIndex();
      setInputSections((prev) => {
        const newInputs = [...prev];
        newInputs[focusIdx] = {
          ...newInputs[focusIdx],
          lockedUserId: user.id,
          value: user.name,
          isReady: true,
        };
        return newInputs;
      });

      const el = document.getElementById("MsgInput:" + focusIdx);
      if (el !== null) el.innerText = user.name;

      InputSection.insertBlock("text", focusIdx);
    },

    /**
     * 指定位置の後ろに新ブロックを挿入
     */
    insertBlock: (type: IInputSections["type"], index: number) => {
      setInputSections((prev) => {
        const newInputs = [...prev];
        const isReadyOption = type === "mention" ? false : undefined;
        const userIdLockedOption = type === "mention" ? "" : undefined;
        newInputs.splice(index + 1, 0, {
          type,
          value: "",
          isReady: isReadyOption,
          lockedUserId: userIdLockedOption,
        });
        return newInputs;
      });

      // SolidJSのFor更新後にフォーカス（DOM生成を待つ）
      queueMicrotask(() => {
        requestAnimationFrame(() => {
          document.getElementById("MsgInput:" + (inputSections().length - 1))?.focus();
        });
      });
    },

    /**
     * 指定位置のブロックを削除
     */
    removeBlock: (index: number) => {
      if (inputSections().length > 1) {
        setInputSections((prev) => prev.filter((_obj, _index) => _index !== index));

        requestAnimationFrame(() => {
          document.getElementById("MsgInput:" + (index - 1))?.focus();
        });
      }
    },

    /**
     * メンション用ユーザー検索
     */
    searchUser: (query: string) => {
      setUserList([]);
      GET_USER_SEARCH(query, currentChannelId())
        .then((r) => setUserList(r.data))
        .catch((e) => console.error("searchUser :: e->", e));
    },
  };

  const KeyHandler = {
    /**
     * テキスト/URLブロック用キーダウンハンドラ
     */
    forText: (e: KeyboardEvent, index: number) => {
      switch (e.key) {
        case "@": {
          e.preventDefault();
          InputSection.insertBlock("mention", index);
          break;
        }
        case "Backspace": {
          if ((e.currentTarget as HTMLElement).textContent === "") {
            e.preventDefault();
            InputSection.removeBlock(index);
          }
          break;
        }
        case "Enter": {
          if (/Mac/.test(navigator.userAgent) && e.isComposing) break;
          if (e.shiftKey) break;
          if (storeClientConfig.chat.sendWithCtrlKey && !e.ctrlKey) break;

          e.preventDefault();
          Message.send();
          break;
        }
      }
    },

    /**
     * メンションブロック用キーダウンハンドラ
     */
    forMention: (e: KeyboardEvent, index: number) => {
      switch (e.key) {
        case "@": {
          e.preventDefault();
          break;
        }
        case " ": {
          e.preventDefault();
          InputSection.insertBlock("text", index);
          break;
        }
        case "Backspace": {
          if ((e.currentTarget as HTMLElement).textContent === "") {
            e.preventDefault();
            InputSection.removeBlock(index);
          }
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (userList().length > 0) {
            InputSection.bindUserId(userList()[0]);
          }
          break;
        }
      }
    },
  };

  /**
   * セクション配列→送信用プレビュー文字列
   */
  const previewString = createMemo(() => {
    return inputSections()
      .map((section) => {
        switch (section.type) {
          case "text":
            return section.value;
          case "mention":
            if (section.isReady && section.lockedUserId) {
              return `@<${section.lockedUserId}> `;
            }
            return `@${section.value}`;
          case "channel":
            return `#<${section.value}> `;
          case "emoji":
            return `:<${section.value}:> `;
          case "newline":
            return "\n";
          case "url":
            return section.value;
          case "messageLink":
            return `&<${section.value}> `;
          default:
            return section.value;
        }
      })
      .join("");
  });

  const Message = {
    /**
     * メッセージ送信
     */
    send: () => {
      const messageString = previewString();
      if (messageString.trim() === "" && fileIds().length === 0) return;

      POST_MESSAGE_SEND(
        currentChannelId(),
        messageString,
        fileIds(),
        storeReplyingMessageId[currentChannelId()] || undefined,
      )
        .then(() => { })
        .catch((e) => console.error("POST_MESSAGE_SEND :: e->", e));

      // 初期化
      setInputSections([{ type: "text", value: "" }]);
      setFileIds([]);
      setFileInput([]);
      setUserList([]);
      delete storeReplyingMessageId[currentChannelId()];

      // 新しいcontentEditable要素にフォーカス
      requestAnimationFrame(() => {
        document.getElementById("MsgInput:0")?.focus();
      });
    },
  };

  const FileOps = {
    /**
     * ファイルIDを追加
     */
    pushFileId: (fileId: string) => {
      setFileIds([...fileIds(), fileId]);
    },

    /**
     * ファイル選択ダイアログを開く
     */
    bindFiles: () => {
      const fileInputEl = document.getElementById("fileInput") as HTMLInputElement;
      fileInputEl.value = "";
      fileInputEl.click();
      fileInputEl.onchange = (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (files) {
          setFileInput([...fileInput(), ...files]);
        }
      };
    },

    /**
     * ペーストイベントからファイルを受け取る
     */
    receiveFiles: (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        const files = [];
        for (let i = 0; i < items.length; i++) {
          if (items[i].kind === "file") {
            const file = items[i].getAsFile();
            if (file) files.push(file);
          }
        }
        if (files.length > 0) {
          setFileInput([...fileInput(), ...files]);
        }
      }
    },

    /**
     * ファイルID・ファイル入力から削除
     */
    removeFileId: (fileId: string, fileName: string) => {
      setFileInput(fileInput().filter((f) => f.name !== fileName));
      setFileIds(fileIds().filter((id) => id !== fileId));
    },
  };

  // ===== JSX =====

  return (
    <div class={"flex flex-col gap-2 pb-1"} onPaste={(e) => FileOps.receiveFiles(e)}>
      {/* ファイルアップロードプレビュー */}
      <Show when={fileInput().length > 0}>
        <div class={"flex items-center overflow-x-auto gap-1"}>
          <For each={fileInput()}>
            {(file) => (
              <div class={"w-fit flex items-center"}>
                <FileUploadPreview
                  file={file}
                  dataSetter={FileOps.pushFileId}
                  onRemove={(fileId, fileName) => FileOps.removeFileId(fileId, fileName)}
                />
              </div>
            )}
          </For>
        </div>
        <hr />
      </Show>

      {/* 返信先メッセージ表示 */}
      <Show when={storeReplyingMessageId[currentChannelId()] !== undefined}>
        <ReplyMessageDisplay
          messageId={storeReplyingMessageId[currentChannelId()]}
          onRemove={() => delete storeReplyingMessageId[currentChannelId()]}
          channelId={currentChannelId()}
        />
      </Show>

      {/* メッセージプレビュー */}
      <Show when={previewString().length > 0}>
        <div class={"border rounded-md p-2 bg-muted/30 text-sm"}>
          <p class={"text-muted-foreground text-xs mb-1"}>プレビュー</p>
          <MessageTextRender content={previewString()} />
        </div>
      </Show>

      {/* 入力エリア + 送信ボタン */}
      <div class="w-full relative flex items-center gap-1">
        <input type={"file"} id={"fileInput"} class={"hidden"} />

        <Button onClick={FileOps.bindFiles} variant={"secondary"} size={"icon"} class="shrink-0">
          <IconUpload />
        </Button>

        {/* ブロック分割入力エリア */}
        <div
          class={"relative border rounded flex flex-wrap w-full p-2 cursor-text shrink min-w-0 grow bg-background min-h-[40px] max-h-40 overflow-y-auto break-all"}
          onClick={() => {
            document.getElementById("MsgInput:" + (inputSections().length - 1))?.focus();
            setCurrentFocusIndex(inputSections().length - 1);
          }}
        >
          <For each={inputSections()}>
            {(inp, index) => (
              <>
                <SolidSwitch>
                  <Match when={inp.type === "text"}>
                    <div
                      id={"MsgInput:" + index()}
                      contentEditable
                      onClick={(e) => e.stopPropagation()}
                      onInput={(e) => InputSection.bind(e.currentTarget.textContent || "", index())}
                      onFocus={() => setCurrentFocusIndex(index())}
                      class={"shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
                      onKeyDown={(e) => KeyHandler.forText(e, index())}
                    />
                  </Match>
                  <Match when={inp.type === "mention"}>
                    <Card class={"flex items-center bg-border"}>
                      <p>@</p>
                      <div
                        id={"MsgInput:" + index()}
                        contentEditable={!inputSections()[index()]?.isReady}
                        onClick={(e) => !inputSections()[index()]?.isReady && e.stopPropagation()}
                        onInput={(e) => InputSection.bind(e.currentTarget.textContent || "", index())}
                        onFocus={() => setCurrentFocusIndex(index())}
                        class={"shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
                        onKeyDown={(e) => KeyHandler.forMention(e, index())}
                      />
                    </Card>
                  </Match>
                  <Match when={inp.type === "url"}>
                    <div
                      id={"MsgInput:" + index()}
                      contentEditable
                      onClick={(e) => e.stopPropagation()}
                      onInput={(e) => InputSection.bind(e.currentTarget.textContent || "", index())}
                      onFocus={() => setCurrentFocusIndex(index())}
                      class={"text-blue-500 underline shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
                      onKeyDown={(e) => KeyHandler.forText(e, index())}
                    />
                  </Match>
                </SolidSwitch>
              </>
            )}
          </For>

          {/* メンション用ユーザー検索バー */}
          <Show
            when={
              inputSections()[currentFocusIndex()]?.type === "mention" &&
              !inputSections()[currentFocusIndex()]?.isReady
            }
          >
            <Card class={"absolute w-full rounded-b-none bottom-full left-0 m-0 p-2 overflow-y-auto max-h-40 z-10"}>
              <Show when={userList().length === 0}>
                <p class={"text-center"}>２文字以上でユーザーを検索</p>
              </Show>
              <Show when={userList().length > 0}>
                <For each={userList()}>
                  {(user) => (
                    <Card
                      onClick={() => InputSection.bindUserId(user)}
                      class={"flex items-center border-0 gap-2 p-1 cursor-pointer hover:bg-border"}
                    >
                      <img src={`/api/user/icon/${user.id}`} alt={user.name} class={"w-8 h-8 rounded-full"} />
                      <p class={"truncate"}>{user.name}</p>
                    </Card>
                  )}
                </For>
              </Show>
            </Card>
          </Show>
        </div>

        <Button onClick={Message.send} size={"icon"} class={"shrink-0"}>
          <IconSend />
        </Button>
      </div>
    </div>
  );
}
