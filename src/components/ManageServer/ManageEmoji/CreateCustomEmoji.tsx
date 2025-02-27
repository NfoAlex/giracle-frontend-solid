import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {IconPlus} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";
import {TextField, TextFieldInput} from "~/components/ui/text-field";
import {Label} from "~/components/ui/label";
import {Card} from "~/components/ui/card";
import {createSignal, Show} from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";
import PUT_SERVER_CUSTOM_EMOJI_UPLOAD from "~/api/SERVER/SERVER_CUSTOM_EMOJI_UPLOAD";

export default function CreateCustomEmoji() {
  const [dialogDisplay, setDialogDisplay] = createSignal<boolean>(false);
  const [customEmoji, setCustomEmoji] = createSignal<File|null>(null);
  const [customEmojiCode, setCustomEmojiCode] = createSignal<string>("");
  const [emojiPreviewUrl, setEmojiPreviewUrl] = createSignal<string>("");
  const [processing, setProcessing] = createSignal<boolean>(false);

  const uploadEmoji = () => {
    const emojiFile = customEmoji();
    if (emojiFile === null) return;
    //処理中と設定
    setProcessing(true);

    PUT_SERVER_CUSTOM_EMOJI_UPLOAD(customEmojiCode(), emojiFile)
      .then((r) => {
        console.log("CreateCustomEmoji :: uploadEmoji :: r->", r);
        //ダイアログを閉じる
        setDialogDisplay(false);
      })
      .catch((err) => {
        console.error("CreateCustomEmoji :: uploadEmoji :: err->", err);
        alert("アップロードに失敗しました。 エラー : " + err);
        setProcessing(false);
      });
  }

  /**
   * 絵文字作成用のファイルを入力ハンドラ
   * @param event
   */
  const fileInput = (event: InputEvent & {
    currentTarget: HTMLInputElement
    target: DOMElement
  }) => {
    //イベントターゲットの要素取得
    const currentTarget = event.currentTarget;
    if (currentTarget === null) return;
    //ファイルを取得
    const files = currentTarget.files;
    if (files === null) return;

    //ファイルオブジェクトを格納
    setCustomEmoji(files[0]);

    //ファイルプレビューをするためのURL生成
    const reader = new FileReader();
      //格納
    reader.onload = () => {
      setEmojiPreviewUrl(reader.result as string);
    }
      //ここで生成
    reader.readAsDataURL(files[0]);
  }

  return (
    <Dialog open={dialogDisplay()} onOpenChange={setDialogDisplay}>
      <DialogContent>
        <DialogHeader>
          カスタム絵文字の作成
          <hr class={"my-2"} />
        </DialogHeader>

        <div class={"flex flex-col gap-8"}>
          <TextField>
            <Label>絵文字コード</Label>
            <TextFieldInput
              value={customEmojiCode()}
              style={"font-family: consolas;"}
              onInput={(e) =>
                e.currentTarget.value.length<=32 && setCustomEmojiCode(e.currentTarget.value)
              }
            />
          </TextField>

          <TextField>
            <Label>カスタム絵文字ファイルのアップロード</Label>
            <TextFieldInput
              type={"file"}
              onInput={fileInput}
            />
          </TextField>

          <span>
            <Label>絵文字プレビュー</Label>
            <Card class={"flex items-center p-0"}>
              <div class={"bg-white rounded w-1/2 py-6 text-center"}>
                <Show when={emojiPreviewUrl() !== ""}>
                  <img src={emojiPreviewUrl()} alt={"絵文字プレビュー"} class={"w-8 h-8 mx-auto"} />
                </Show>
              </div>
              <div class={"bg-black rounded w-1/2 py-6 text-center"}>
                <Show when={emojiPreviewUrl() !== ""}>
                  <img src={emojiPreviewUrl()} alt={"絵文字プレビュー"} class={"w-8 h-8 mx-auto"} />
                </Show>
              </div>
            </Card>
          </span>
        </div>

        <DialogFooter>
          <Button
            onClick={uploadEmoji}
            disabled={emojiPreviewUrl()==="" || customEmojiCode()==="" || processing()}
          >アップロードする</Button>
        </DialogFooter>
      </DialogContent>

      <DialogTrigger>
        <Button class={"w-full p-4 z-50"}>
          <IconPlus />
          <p>カスタム絵文字を作成</p>
        </Button>
      </DialogTrigger>
    </Dialog>
  )
}