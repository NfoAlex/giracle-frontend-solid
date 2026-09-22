import { IconAlertCircle, IconPlus } from "@tabler/icons-solidjs";
import { createSignal, Show } from "solid-js";
import { api } from "~/api";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "~/components/ui/text-field";
import type { IBot } from "~/types/Server";

export default function SubmitBotCreation(props: { dataBinder: (bot: IBot) => void }) {
  const [botName, setBotName] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");
  const [open, setOpen] = createSignal(false); //ダイアログの開閉
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  /**
   * bot作成
   */
  const createBotRequest = () => {
    if (processing()) return;
    setProcessing(true);
    setError(null);

    api.server.putBot({
      name: botName(),
      // 概要が未入力ならキーごと送らない。
      // バックエンドは指定時に1文字以上を要求するため、空文字を送ると422になる
      description: description() || undefined,
    })
      .then((r) => {
        props.dataBinder(r.data); //親のBot一覧に追加する
        setBotName("");
        setDescription("");
        setOpen(false); //ダイアログを閉じる
      })
      .catch((err) => {
        console.error("SubmitBotCreation :: createBotRequest : err ->", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setProcessing(false);
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
        <Show when={error()}>
          <Alert variant="destructive">
            <IconAlertCircle class="size-6" />
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>内容: {error()}</AlertDescription>
          </Alert>
        </Show>
        <DialogFooter>
          <Button
            onClick={createBotRequest}
            disabled={botName() === "" || processing()}
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
