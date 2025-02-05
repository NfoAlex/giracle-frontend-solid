import {createSignal, For, Show} from "solid-js";
import { TextField, TextFieldInput } from "../ui/text-field";
import { Button } from "../ui/button";
import { useParams } from "@solidjs/router";
import POST_MESSAGE_SEND from "~/api/MESSAGE/MESSAGE_SEND";
import {IconUpload} from "@tabler/icons-solidjs";
import FileUploadPreview from "~/components/Channel/ChannelTextInput/FileUploadPreview";
import type {IUser} from "~/types/User";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Card } from "../ui/card";

interface ISearchValObj {
  type: "user" | "channel",
  startPos: number,
  endPos: number
}

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
  let [searchOptions, setSearchOptions] = createSignal<{ type:"user"|"channel", isEnabled:boolean }>({
    type: "user",
    isEnabled: false,
  });

  const sendMsg = () => {
    console.log("ChannelTextInput :: sendMsg : params.id->", {...params});

    POST_MESSAGE_SEND(params.channelId, text(), fileIds())
      .then((r) => {
        console.log("POST_MESSAGE_SEND :: r->", r);
        setText("");
        setFileIds([]);
        setFileInput([]);
      })
      .catch((e) => {
        console.error("POST_MESSAGE_SEND :: e->", e);
      });
  }

  const checkMode = () => {
    //メンションを検索する
    const matches = [...text().matchAll(/@\S+/g)];
    //カーソル位置までのメンションを取得
    const matchesFilter = matches.filter((obj) => cursorPosition >= obj.index);

    //カーソル位置がメンション条件の範囲中にあるかどうか
    for (const arr of matchesFilter) {
      console.log("ChannelTextInput :: checkMode : arr->", arr.index, (arr.index + arr[0].length));
      if (arr.index <= cursorPosition && cursorPosition <= (arr.index + arr[0].length + 1)) {
        setSearchOptions({
          type: "user",
          isEnabled: true,
        })
        //ユーザーを検索する
        if (arr[0].length >= 2)
          searchUser(arr[0].slice(1));

        return;
      }
    }
    //console.log("ChannelTextInput :: checkMode : cursorPosition->", cursorPosition, " matches->", matches, matchesFilter);

    //メンション検索が無効の場合
    setSearchOptions(
      {
        type: "user",
        isEnabled: false,
      }
    );
  }

  /**
   * メンション用のユーザー検索
   * @param query
   */
  const searchUser = (query: string) => {
    GET_USER_SEARCH(query, params.channelId)
      .then((r) => {
        setUserSearchResult(r.data);
        console.log("GET_USER_SEARCH :: r->", r);
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
        console.log("ChannelTextInput :: bindFiles : fileInput->", fileInput());
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
      console.log("ChannelTextInput :: receiveFiles : fileInput->", fileInput());
    }
  }

  return (
    <div class={"flex flex-col gap-2"}>
      <Show when={fileInput().length > 0}>
        <div class={"flex items-center overflow-x-auto gap-1"}>
          <For each={fileInput()}>
            {(file) => {
              return (
                <div class={"w-fit flex items-center"}>
                  <FileUploadPreview
                    file={file}
                    dataSetter={pushFileIds}
                  />
                </div>
              );
            }}
          </For>
        </div>
        <hr />
      </Show>
      <div class="relative flex items-center gap-1">
        <input type={"file"} id={"fileInput"} class={"hidden"} />

        <Button onClick={bindFiles} variant={"secondary"}><IconUpload /></Button>
        <TextField class="grow">
          <TextFieldInput
            type="text"
            id={"messageInput"}
            value={text()}
            onInput={(e) => {
              cursorPosition = e.currentTarget?.selectionStart || 0;
              checkMode();
              setText(e.currentTarget.value);
            }}
            onKeyDown={(e) => {
              switch(e.key) {
                case "Enter": {
                  sendMsg();
                  break;
                }
              }
            }}
            onPaste={(e) => receiveFiles(e)}
          />
        </TextField>

        <Button onClick={sendMsg}>送信</Button>

        {/* メンション用ユーザー検索 */}
        <Show when={searchOptions().isEnabled && searchOptions().type === "user"}>
          <Card class={"absolute left-0 bottom-full border-b-0 w-full p-2 overflow-y-auto max-h-40"}>
            <For each={userSearchResult()}>
              {(user) => {
                return (
                  <div class={"flex items-center gap-2 p-2 rounded hover:bg-border"}>
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
