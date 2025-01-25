import { IconCheck, IconUserCircle } from "@tabler/icons-solidjs";
import { Show, createSignal } from "solid-js";
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
import POST_USER_CHANGE_BANNER from "~/api/USER/USER_CHANGE_BANNER";
import {TextField, TextFieldInput} from "~/components/ui/text-field";

export default function ChangeBanner() {
  const [file, setFile] = createSignal<File | null>(null);
  const [result, setResult] = createSignal<"success" | "error" | "">("");

  /**
   * プロフィールバナーの変更
   */
  const changeBanner = () => {
    //ファイル入力がないなら停止
    const _file = file();
    if (_file === null) return;
    //バナーの変更
    POST_USER_CHANGE_BANNER(_file)
      .then((r) => {
        setResult("success");
      })
      .catch((e) => {
        console.log("ChangeBanner :: changeBanner : e->", e);
        setResult("error");
      });
  };

  return (
    <Dialog>
      <DialogTrigger class="mx-auto">
        <Button
          class="mx-auto flex flex-row items-center gap-2"
          variant={"default"}
        >
          <IconUserCircle />
          <p>バナー画像を変更する</p>
        </Button>
      </DialogTrigger>

      <DialogContent id="dialogChangeIcon">
        <DialogHeader>
          <DialogTitle>ユーザーバナーを変更する</DialogTitle>
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
            <Button onClick={changeBanner} disabled={file() === null}>
              変更する
            </Button>
          </Show>
        </DialogFooter>

        <Show when={result() === "error"}>
          <Callout class="float-end" variant={"error"}>
            <CalloutTitle>エラー！</CalloutTitle>
            <CalloutContent>
              バナーを変更できませんでした。しばらくしてからもう一度お試しください。
            </CalloutContent>
          </Callout>
        </Show>
      </DialogContent>
    </Dialog>
  );
}
