import { IconCheck, IconUserCircle } from "@tabler/icons-solidjs";
import { Show, createSignal } from "solid-js";
import POST_USER_CHANGE_ICON from "~/api/USER/USER_CHANGE_ICON";
import { Button } from "../ui/button";
import { Callout, CalloutContent, CalloutTitle } from "../ui/callout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {TextField, TextFieldInput} from "~/components/ui/text-field";

export default function ChangeIcon() {
  const [file, setFile] = createSignal<File | null>(null);
  const [result, setResult] = createSignal<"success" | "error" | "">("");

  /**
   * アイコンの変更
   */
  const changeIcon = () => {
    //ファイル入力がないなら停止
    const _file = file();
    if (_file === null) return;
    //アイコンの変更
    POST_USER_CHANGE_ICON(_file)
      .then(() => {
        setResult("success");
      })
      .catch((e) => {
        console.error("ChangeIcon :: changeIcon : e->", e);
        setResult("error");
      });
  };

  return (
    <Dialog>
      <DialogTrigger class="mx-auto">
        <Button
          class="mx-auto flex flex-row items-center gap-2"
          variant={"outline"}
        >
          <IconUserCircle />
          <p>アイコン画像を変更する</p>
        </Button>
      </DialogTrigger>

      <DialogContent id="dialogChangeIcon">
        <DialogHeader>
          <DialogTitle>アイコンを変更する</DialogTitle>
          <DialogDescription>
            <div class="flex flex-col gap-2">
              <TextField>
                <TextFieldInput
                  type={"file"}
                  class="mx-auto mt-2"
                  onInput={(e) =>
                    setFile(
                      e.currentTarget.files !== null
                        ? e.currentTarget.files[0]
                        : null,
                    )
                  }
                  accept=".jpeg,.jpg,.gif,.png"
                />
              </TextField>
            </div>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Show when={result() !== "success"} fallback={<IconCheck />}>
            <Button onClick={changeIcon} disabled={file() === null}>
              変更する
            </Button>
          </Show>
        </DialogFooter>

        <Show when={result() === "error"}>
          <Callout class="float-end" variant={"error"}>
            <CalloutTitle>エラー！</CalloutTitle>
            <CalloutContent>
              アイコンを変更できませんでした。しばらくしてからもう一度お試しください。
            </CalloutContent>
          </Callout>
        </Show>
      </DialogContent>
    </Dialog>
  );
}
