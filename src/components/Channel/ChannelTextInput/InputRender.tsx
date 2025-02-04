import {createSignal, For, Match, Switch as SolidSwitch} from "solid-js";
import {TextField, TextFieldInput, TextFieldTextArea} from "~/components/ui/text-field";
import {Card} from "~/components/ui/card";

interface IMessageInput {
  type: "text"|"mention"|"channel",
  data: string
}

export default function InputRender() {
  const [inputs, setInputs] = createSignal<IMessageInput[]>([
    {type: "text", data: ""},
  ]);

  /**
   * テキスト入力をバインドする
   */
  const bindInput = (value: string, index: number) => {
    //console.log("bindInput : value->", value.at(-1));
    //if (value.at(-1) === "@") return;

    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs[index].data = value;
      return newInputs;
    });
  }

  const AtSignTrigger = (index: number) => {
    console.log("@");

    // setInputs((prev) => {
    //   const newInputs = [...prev];
    //   newInputs.splice(index + 1, 0, {type: "mention", data: ""});
    //   return newInputs;
    // });
    insertBlock("mention", index);
    console.log("inputs->", inputs());

    //document.getElementById("MsgInput:" + (inputs().length - 1))?.focus();
  }

  const insertBlock = (type: IMessageInput["type"], index: number) => {
    setInputs((prev) => {
      const newInputs = [...prev];
      newInputs.splice(index + 1, 0, {type, data: ""});
      return newInputs;
    });

    //フォーカスを移す
    document.getElementById("MsgInput:" + (inputs().length - 1))?.focus();
  }

  return (
    <div class={"border rounded flex flex-wrap"}>
      <For each={inputs()}>
        {
          (inp, index) => (
            <div>
              {index()} :  { inp.type } - { inp.data }
              <SolidSwitch>
                <Match when={inp.type === "text"}>
                  <TextField class={"w-full p-0"}>
                    <TextFieldTextArea
                      autoResize
                      rows={1}
                      id={"MsgInput:" + index()}
                      value={inp.data}
                      class={"border-red-700 min-w-[3ch] h-min max-w-full shrink p-0"}
                      style={`width: ${inputs()[index()].data.length}ch`}
                      onInput={(e) => bindInput(e.currentTarget.value, index())}
                      onKeyDown={
                        (e) => {
                          switch(e.key) {
                            case "@": {
                              AtSignTrigger(index());
                              break;
                            }
                          }
                        }
                      }
                    />
                  </TextField>
                </Match>
                <Match when={inp.type === "mention"}>
                  <Card>
                    <TextField>
                      <TextFieldInput
                        type="text"
                        id={"MsgInput:" + index()}
                        class={"border-0"}
                        value={inp.data}
                        onInput={(e) => bindInput(e.currentTarget.value, index())}
                        onKeyDown={
                          (e) => {
                            switch(e.key) {
                              case " ": {
                                e.preventDefault();
                                insertBlock("text", index());
                                break;
                              }
                              default: {
                                console.log("mention : key->", e.key);
                              }
                            }
                          }
                        }
                      />
                    </TextField>
                  </Card>
                </Match>
              </SolidSwitch>
            </div>
          )
        }
      </For>
    </div>
  )
}