import {createSignal, For, Match, Show, Switch as SolidSwitch} from "solid-js";
import {useParams} from "@solidjs/router";
import { IUser } from "~/types/User.ts";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.ts";
import { Card } from "~/components/ui/card.tsx";

interface IMessageInput {
  type: "text"|"mention"|"channel",
  data: string,
  isReady?: boolean,
  lockedUserId?: string,
}

export default function InputRender() {
  const params = useParams();
  const [inputs, setInputs] = createSignal<IMessageInput[]>([
    {type: "text", data: ""},
  ]);
  const [userList, setUserList] = createSignal<IUser[]>([]);
  let currentFocusIndex = 0;

  /**
   * テキスト入力をバインドする
   */
  const bindInput = (value: string, index: number) => {
    if (inputs()[currentFocusIndex].type === "mention") {
      if (value.length >= 2) {
        searchUser(value);
      }
    }

    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index].data = value;
      return newInputs;
    });
  }

  /**
   * メンション用のユーザーIDをバインドする
   * @param user
   */
  const bindUserId = (user: IUser) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[currentFocusIndex].lockedUserId = user.id;
      newInputs[currentFocusIndex].data = user.name;
      newInputs[currentFocusIndex].isReady = true;
      return newInputs;
    });

    const el = document.getElementById("MsgInput:" + (currentFocusIndex));
    if (el !== null) el.innerText = user.name;

    //console.log("bindUserId : inputs->", inputs()[currentFocusIndex]);
    insertBlock("text", currentFocusIndex);
  }

  const AtSignTrigger = (index: number) => {
    //console.log("@");
    insertBlock("mention", index);
    //console.log("inputs->", inputs());
  }

  const insertBlock = (type: IMessageInput["type"], index: number) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      //メンション用オプション
      const isReadyOption = type === "mention" ? false : undefined;
      const userIdLockedOption = type === "mention" ? "" : undefined;
      //配列操作
      newInputs.splice(
        index + 1,
        0,
        {type, data: "", isReady: isReadyOption, lockedUserId: userIdLockedOption}
      );
      return newInputs;
    });

    //フォーカスを移す
    document.getElementById("MsgInput:" + (inputs().length - 1))?.focus();
  }

  const removeBlock = (index: number) => {
    //console.log("removeBlock : index->", index);
    if (inputs().length > 1) {
      setInputs((prev) => {
        let newInputs = [...prev];
        //newInputs.splice(index, 1);
        newInputs = newInputs.filter((_obj, _index) => _index!==index)
        return newInputs;
      });

      //フォーカスを移す
      document.getElementById("MsgInput:" + (index - 1))?.focus();
    }
  }

  const searchUser = async (query: string) => {
    setUserList([]);
    GET_USER_SEARCH(query, params.channelId)
      .then((r) => {
        setUserList(r.data);
      })
      .catch((e) => console.error("searchUser :: e->", e));
  }

  return (
    <div
      class={"relative border rounded flex flex-wrap w-full p-2 cursor-text"}
      onClick={() => { document.getElementById("MsgInput:" + (inputs().length-1))?.focus() }}
    >
      <For each={inputs()}>
        {
          (inp, index) => (
            <>
              <SolidSwitch>
                <Match when={inp.type === "text"}>
                  <div
                    id={"MsgInput:" + index()}
                    contentEditable
                    onClick={(e) => e.stopPropagation()}
                    onInput={(e) => bindInput(e.currentTarget.textContent || "", index())}
                    onFocus={() => currentFocusIndex = index()}
                    class={"border-red-700 border-2 shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
                    onKeyDown={
                      (e) => {
                        switch(e.key) {
                          case "@": {
                            e.preventDefault();
                            AtSignTrigger(index());
                            break;
                          }
                          case "Backspace": {
                            if (e.currentTarget.textContent === "") {
                              e.preventDefault();
                              removeBlock(index());
                            }
                            break;
                          }
                        }
                      }
                    }
                  />
                </Match>
                <Match when={inp.type === "mention"}>
                  <Card class={"flex items-center bg-border"}>
                    <p>@</p>
                    <div
                      id={"MsgInput:" + index()}
                      contentEditable={!inputs()[index()].isReady}
                      onClick={(e) => !inputs()[index()].isReady && e.stopPropagation()}
                      onInput={(e) => bindInput(e.currentTarget.textContent || "", index())}
                      onFocus={() => currentFocusIndex = index()}
                      class={"shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
                      onKeyDown={
                        (e) => {
                          switch (e.key) {
                            case "@": {
                              e.preventDefault();
                              break;
                            }
                            case " ": {
                              e.preventDefault();
                              insertBlock("text", index());
                              break;
                            }
                            case "Backspace": {
                              if (e.currentTarget.textContent === "") {
                                e.preventDefault();
                                removeBlock(index());
                              }
                              break;
                            }
                            default: {
                              //console.log("mention : key->", e.key);
                            }
                          }
                        }
                      }
                    />

                  </Card>
                </Match>
              </SolidSwitch>
            </>
          )
        }
      </For>

      {/* メンション用ユーザー検索バー */}
      <Show when={inputs()[currentFocusIndex]?.type === "mention" && !inputs()[currentFocusIndex]?.isReady}>
        <Card class={"absolute w-full rounded-b-none bottom-full left-0 m-0 p-2 overflow-y-auto max-h-40"}>
          <Show when={userList().length === 0}>
            <p class={"text-center"}>２文字以上でユーザーを検索</p>
          </Show>

          <Show when={userList().length > 0}>
            <For each={userList()}>
              {(user) => (
                <Card
                  onClick={() => bindUserId(user)}
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
  )
}