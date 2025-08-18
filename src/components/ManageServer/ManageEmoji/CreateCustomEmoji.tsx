import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {IconPlus} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";
import {TextField, TextFieldInput} from "~/components/ui/text-field";
import {Label} from "~/components/ui/label";
import {Card} from "~/components/ui/card";
import {createSignal, Show} from "solid-js";
import type { DOMElement } from "solid-js/jsx-runtime";
import PUT_SERVER_CUSTOM_EMOJI_UPLOAD from "~/api/SERVER/SERVER_CUSTOM_EMOJI_UPLOAD";
import {Callout, CalloutContent, CalloutTitle} from "~/components/ui/callout";

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
        //console.log("CreateCustomEmoji :: uploadEmoji :: r->", r);
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
          <p class={"font-bold"}>カスタム絵文字の作成</p>
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
            <Show when={customEmojiCode().includes(" ")}>
              <Callout variant={"error"} class={"my-2"}>
                <CalloutTitle>絵文字コードに空白は含められません。</CalloutTitle>
              </Callout>
            </Show>
            <Show when={(/[^\u0020-\u007E]/).test(customEmojiCode())}>
              <Callout variant={"error"} class={"my-2"}>
                <CalloutTitle>絵文字コードに全角文字は使えません。</CalloutTitle>
              </Callout>
            </Show>
          </TextField>

          <TextField>
            <Label>カスタム絵文字ファイルのアップロード</Label>
            <TextFieldInput
              type={"file"}
              onInput={fileInput}
            />
            <Show when={customEmoji()?.type === "image/png"}>
              <Callout variant={"warning"} class={"my-2"}>
                <CalloutTitle>注意</CalloutTitle>
                <CalloutContent>この画像がAPNGファイルの場合、作成時アニメーションが削除されます。アニメーションを保持したい場合、GIF画像を使用してください。</CalloutContent>
              </Callout>
            </Show>
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
            disabled={
              emojiPreviewUrl()==="" || customEmojiCode()==="" || processing() || (/[^\u0020-\u007E]/).test(customEmojiCode()) || customEmojiCode().includes(" ")
            }
          >アップロードする</Button>
        </DialogFooter>
      </DialogContent>

      <DialogTrigger>
        <Button class={"w-full p-4 z-50"} variant={"secondary"}>
          <IconPlus />
          <p>カスタム絵文字を作成</p>
        </Button>
      </DialogTrigger>
    </Dialog>
  )
}