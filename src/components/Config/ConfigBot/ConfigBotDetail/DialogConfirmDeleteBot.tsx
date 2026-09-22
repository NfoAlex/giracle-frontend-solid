import { IconAlertCircle } from "@tabler/icons-solidjs";
import { createSignal, Show } from "solid-js";
import { api } from "~/api";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

export default function DialogConfirmDeleteBot(props: {
  botId: string;
  botName: string;
  onDeleted: () => void;
}) {
  const [displayDialog, setDisplayDialog] = createSignal(false);
  const [processing, setProcessing] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const deleteBot = () => {
    setProcessing(true);
    setError(null);
    api.server
      .deleteBotById({ botId: props.botId })
      .then(() => {
        // 削除成功 → 親に一覧へ戻すよう伝える
        props.onDeleted();
      })
      .catch((e) => {
        console.error("DialogConfirmDeleteBot :: deleteBot : e", e);
        setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        setProcessing(false);
      });
  };

  return (
    <>
      <Button
        variant={"destructive"}
        onClick={() => {
          setError(null);
          setDisplayDialog(true);
        }}
      >
        このボットを削除する
      </Button>

      <Dialog open={displayDialog()} onOpenChange={setDisplayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Botの削除</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>Botを削除します。よろしいですか？</p>
            <span class="truncate flex items-center gap-2">
              <p class="shrink-0">削除するBot:</p>
              <span class="font-bold truncate w-32 md:w-[256px]">
                {props.botName}
              </span>
            </span>
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
              onClick={() => setDisplayDialog(false)}
              variant={"ghost"}
              disabled={processing()}
            >
              キャンセル
            </Button>
            <Button
              onClick={deleteBot}
              variant={"destructive"}
              disabled={processing()}
            >
              {processing() ? "削除中..." : "削除する"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
