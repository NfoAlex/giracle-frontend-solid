import { IconPlus } from "@tabler/icons-solidjs";
import { createSignal } from "solid-js";
import { api } from "~/api";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "~/components/ui/text-field";
import type { IBot } from "~/types/Server";

export default function SubmitBotCreation(props: { dataBinder: (bot: IBot) => void }) {
  const [botName, setBotName] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");
  const [open, setOpen] = createSignal(false); //ダイアログの開閉

  /**
   * bot作成
   */
  const createBotRequest = () => {
    api.server.putBot({ name: botName(), description: description() })
      .then((r) => {
        //console.log("CreateChannel :: createChannel :: r ->", r);
        props.dataBinder(r.data); //親のBot一覧に追加する
        setOpen(false); //ダイアログを閉じる
      })
      .catch((err) => {
        console.error("CreateChannel :: createChannel :: err ->", err);
      });
  }

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle>
          Botの作成
        </DialogTitle>
        <DialogDescription class="flex flex-col gap-4">
          <TextField class="grid w-full items-center gap-2">
            <TextFieldLabel for="email">Bot名</TextFieldLabel>
            <TextFieldInput
              type="text"
              placeholder="Bot名"
              value={botName()}
              onInput={(e)=>setBotName(e.currentTarget.value)}
            />
          </TextField>
          <TextField class="grid w-full items-center gap-2">
            <TextFieldLabel for="email">概要</TextFieldLabel>
            <TextFieldTextArea
              placeholder="概要"
              value={description()}
              onInput={(e)=>setDescription(e.currentTarget.value)}
            />
          </TextField>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={createBotRequest}
            disabled={botName() === ""}
            type="submit"
          >作成</Button>
        </DialogFooter>
      </DialogContent>
      <DialogTrigger>
        <Button class="">
          <IconPlus />
          ボットを作成
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
