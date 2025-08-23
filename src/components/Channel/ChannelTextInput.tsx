import {createSignal, For, Show} from "solid-js";
import { TextField } from "../ui/text-field";
import { Button } from "../ui/button";
import { useParams } from "@solidjs/router";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND";
import {IconSend, IconUpload} from "@tabler/icons-solidjs";
import FileUploadPreview from "~/components/Channel/ChannelTextInput/FileUploadPreview";
import type {IUser} from "~/types/User";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Card } from "../ui/card";
import { IChannel } from "~/types/Channel";
import { storeClientConfig } from "~/stores/ClientConfig";

export default function ChannelTextInput() {
  const params = useParams(); //URLパラメータを取得するやつ
  const [text, setText] = createSignal(""); //メッセージテキスト
  const [fileIds, setFileIds] = createSignal<string[]>([]); //送信に使うファイルIDの配列
  const pushFileIds = (fileId: string) => { //ファイルIDを追加するようの関数
    setFileIds([...fileIds(), fileId]);
  }
  const [fileInput, setFileInput] = createSignal<File[]>([]); //ファイル選択ダイアログからのファイル入力受け取り用配列
  const [userSearchResult, setUserSearchResult] = createSignal<IUser[]>([]); //ユーザー検索結果
  let cursorPosition = 0; //フォーム上のカーソル位置
  let [searchOptions, setSearchOptions] = createSignal<{ type:"user"|"channel", isEnabled:boolean, query: string, selectIndex: number }>({
    type: "user",
    isEnabled: false,
    query: "",
    selectIndex: 0
  });

  const sendMsg = () => {
    //console.log("ChannelTextInput :: sendMsg : params.id->", {...params});

    POST_MESSAGE_SEND(params.channelId, text(), fileIds())
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
    setFileInput([]);
    //検索モードを初期化
    setSearchOptions({
      type: "user",
      isEnabled: false,
      query: "",
      selectIndex: 0,
    });
  }

  /**
   * 検索モードの条件判別、設定をする
   */
  const checkMode = () => {
    //メンションを検索する
    const matches = [...text().matchAll(/@\S+/g)];
    //カーソル位置までのメンションを取得
    const matchesFilter = matches.filter((obj) => cursorPosition >= obj.index);

    //カーソル位置がメンション条件の範囲中にあるかどうか
    for (const arr of matchesFilter) {
      //console.log("ChannelTextInput :: checkMode : arr->", arr.index, (arr.index + arr[0].length));
      if (arr.index <= cursorPosition && cursorPosition <= (arr.index + arr[0].length + 1)) {
        setSearchOptions({
          type: "user",
          isEnabled: true,
          query: arr[0].slice(1),
          selectIndex: 0,
        })
        //ユーザーを検索する
        if (arr[0].length >= 2)
          searchUser(searchOptions().query);

        return;
      }
    }
    //console.log("ChannelTextInput :: checkMode : cursorPosition->", cursorPosition, " matches->", matches, matchesFilter);

    //メンション検索が無効の場合
    setSearchOptions(
      {
        type: "user",
        isEnabled: false,
        query: "",
        selectIndex: 0,
      }
    );
  }

  /**
   * 検索結果から選択した情報メッセージ文へバインドする
   * @param item バインドする情報
   * @param type バインドする情報の種類
   */
  const bindSearchedItem = (item: IChannel | IUser, type: "user" | "channel") => {
    if (type === "user") {
      //メッセージ文にバインド
      setText(text().replace(searchOptions().query, `<${item.id}> `));
      //フォーカスを戻す
      document.getElementById("messageInput")?.focus();
      //検索モードを初期化
      setSearchOptions({
        type: "user",
        isEnabled: false,
        query: "",
        selectIndex: 0,
      });
    }
    if (type === "channel") {
      // これから
    }
  }

  /**
   * メンション用のユーザー検索
   * @param query
   */
  const searchUser = (query: string) => {
    GET_USER_SEARCH(query, params.channelId)
      .then((r) => {
        setUserSearchResult(r.data);
        //console.log("GET_USER_SEARCH :: r->", r);
      })
      .catch((e) => console.error("GET_USER_SEARCH :: e->", e));
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
      <div class="w-full relative flex items-center gap-1">
        <input type={"file"} id={"fileInput"} class={"hidden"} />

        <Button onClick={bindFiles} variant={"secondary"} size={"icon"} class="shrink-0"><IconUpload /></Button>

        <textarea
          id={"messageInput"}
          class={"shrink min-w-0 grow p-2 bg-background resize-none border rounded-md break-all h-fit whitespace-pre-wrap max-h-40"}
          rows={text().match(/\n/g)?.length===0 ? 1 : (text().match(/\n/g)?.length ?? 0) + 1}
          value={text()}
          onInput={(e) => {
            cursorPosition = e.currentTarget?.selectionStart || 0;
            setText(e.currentTarget.value);
            checkMode();
          }}
          onKeyDown={(e) => {
            switch(e.key) {
              case "Enter": {
                //検索モードが有効なら選択した情報をメッセージ文にバインド
                if (searchOptions().isEnabled) {
                  e.preventDefault();
                  bindSearchedItem(userSearchResult()[searchOptions().selectIndex], "user");
                  break;
                }
                //Macなら変換での勝手な送信をブロックする
                if (/Mac/.test(navigator.userAgent) && e.isComposing) break;
                if (e.shiftKey) break;
                
                //設定でCtrlキーを押す必要がある場合
                if (storeClientConfig.chat.sendWithCtrlKey) {
                  if (!e.ctrlKey) break;
                }

                e.preventDefault();
                sendMsg();
                break;
              }
              case "ArrowUp": { //検索モード用の選択移動
                if (searchOptions().isEnabled) {
                  e.preventDefault();
                  if (0 < searchOptions().selectIndex)
                    setSearchOptions({...searchOptions(), selectIndex: searchOptions().selectIndex - 1});
                }
                break;
              }
              case "ArrowDown": { //検索モード用の選択移動
                if (searchOptions().isEnabled) {
                  e.preventDefault();
                  if (userSearchResult().length > searchOptions().selectIndex + 1)
                    setSearchOptions({...searchOptions(), selectIndex: searchOptions().selectIndex + 1});
                }
                break;
              }
            }
          }}
          onPaste={(e) => receiveFiles(e)}
        />

        <Button onClick={sendMsg} size={"icon"} class={"shrink-0"}><IconSend /></Button>

        {/* メンション用ユーザー検索 */}
        <Show when={searchOptions().isEnabled && searchOptions().type === "user"}>
          <Card class={"absolute left-0 bottom-full border-b-0 w-full p-2 overflow-y-auto max-h-40 cursor-pointer"}>
            <Show when={userSearchResult().length === 0}>
              <p class={"text-center"}>...</p>
            </Show>
            <For each={userSearchResult()}>
              {(user, index) => {
                return (
                  <div
                    onClick={()=>bindSearchedItem(user, "user")}
                    class={`flex items-center gap-2 p-2 rounded hover:bg-border ${searchOptions().selectIndex === index()&&"bg-border"}`}
                  >
                    <img alt={user.name} src={`/api/user/icon/${user.id}`} class={"w-8 h-8 rounded-full"} />
                    <div class={"flex-grow"}>
                      <p>{user.name}</p>
                    </div>
                  </div>
                );
              }
            }
            </For>
          </Card>
        </Show>
      </div>
    </div>
  );
}
