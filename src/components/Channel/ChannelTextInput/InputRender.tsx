import {createSignal, For, Match, Show, Switch as SolidSwitch} from "solid-js";
import {Card} from "~/components/ui/card";

interface IMessageInput {
  type: "text"|"mention"|"channel",
  data: string,
  isReady?: boolean,
}

export default function InputRender() {
  const [inputs, setInputs] = createSignal<IMessageInput[]>([
    {type: "text", data: ""},
  ]);
  let currentFocusIndex = 0;

  /**
   * テキスト入力をバインドする
   */
  const bindInput = (value: string, index: number) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index].data = value;
      return newInputs;
    });
  }

  const AtSignTrigger = (index: number) => {
    console.log("@");
    insertBlock("mention", index);
    console.log("inputs->", inputs());
  }

  const insertBlock = (type: IMessageInput["type"], index: number) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      const isReadyOption = type === "mention" ? false : undefined;
      newInputs.splice(index + 1, 0, {type, data: "", isReady: isReadyOption});
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
                      contentEditable
                      onClick={(e) => e.stopPropagation()}
                      onInput={(e) => bindInput(e.currentTarget.textContent || "", index())}
                      onFocus={() => currentFocusIndex = index()}
                      class={"border-orange-700 border-2 shrink min-w-[3ch] max-w-full text-wrap whitespace-pre-wrap break-all focus:outline-none"}
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
                              console.log("mention : key->", e.key);
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
      <Show when={inputs()[currentFocusIndex]?.type === "mention"}>
        <Card class={"absolute w-full rounded-b-none bottom-full left-0 m-0 p-2"}>
          <p>tesuto</p>
        </Card>
      </Show>
    </div>
  )
}