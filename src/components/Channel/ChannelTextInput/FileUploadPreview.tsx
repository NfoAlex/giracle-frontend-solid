import {Card} from "~/components/ui/card";
import {createSignal, onCleanup, onMount, Show} from "solid-js";
import {useParams} from "@solidjs/router";
import { Button } from "~/components/ui/button";
import { IconSquareRoundedX, IconFileFilled } from '@tabler/icons-solidjs';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";
import { ProgressCircle } from "~/components/ui/progress-circle";

export default function FileUploadPreview(
  props: {
    file: File,
    dataSetter: (files: string) => void,
    onRemove?: (fileIdBinded: string, fileName: string) => void,
  }
) {
  const params = useParams();
  const [progress, setProgress] = createSignal(0);
  const [result, setResult] = createSignal<"" | "SUCCESS" | "内部エラー" | `error::${string}`>("");
  const [openFileNameCard, setOpenFileNameCard] = createSignal(false);
  const [previewUrl, setPreviewUrl] = createSignal<string>("");
  let fileIdBinded = "";

  /**
   * ファイルをアップロードする
   */
  const uploadFile = async () => {
    //console.log("FileUploadPreview :: uploadFile : props.file->", props.file, " : params.channelId->", params.channelId);

    //画像ファイルならプレビュー用のURLを生成
    if (props.file.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(props.file));
    }

    //アップロードするデータフォームオブジェクト生成
    const formData = new FormData();
    //送信者情報とディレクトリを付与
    formData.append("channelId", params.channelId);
    //ファイルそのものを内包
    formData.append("file", props.file);

    //アップロード用のXHRインスタンス
    const xhr = new XMLHttpRequest();
    //アップロード状況追跡用
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        //アップロード状況を更新する
        setProgress(Math.round((event.loaded / event.total) * 100));
        /*
        if (progress % 10 === 0)
          console.log("FileChip :: uploadIt : progress->", progress);
        */
      }
    });

    //アップロードの結果用
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        //console.log("FileUploadPreview :: uploadFile : 成功!->", xhr.responseText);
        const result: { result: string; data: { fileId: { id: string } } } = JSON.parse(
          xhr.responseText,
        );
        //結果がちゃんと取れているなら親コンポにファイルIdを渡す
        if (result.data !== undefined) {
          props.dataSetter(result.data.fileId.id);
          //手元の変数にも保存（親コンポーネントのonRemove関数用）
          fileIdBinded = result.data.fileId.id;
          setResult("SUCCESS");
        } else {
          //エラーとして設定
          console.error("FileUploadPreview :: uploadFile : 結果が取れていない->", result);
          setResult("内部エラー");
        }
      } else {
        console.error("FileUploadPreview :: uploadFile : 失敗...->", xhr.statusText);
        setResult(`error::${xhr.statusText}`);
      }
    });

    //アップロード先のURLを指定
    xhr.open("POST", "/api/message/file/upload");
    //アップロードする
    xhr.send(formData);
  }

  onMount(() => uploadFile());
  onCleanup(() => {
    if (previewUrl()) {
      URL.revokeObjectURL(previewUrl());
    }
  })

  return (
    <div class="w-48 h-48 overflow-hidden">
      <Card class={"py-2 h-full w-full flex flex-col gap-1"}>
        {/* 画像のプレビューかファイルアイコンの表示 */}
        <div class="px-2 grow flex justify-center items-center">
          {
            props.file.type.startsWith('image/')
            ?
              <img
                src={previewUrl()}
                class={"rounded object-cover max-h-28 max-w-full"}
                alt={props.file.name}
              />
            :
              <span class="my-auto mx-auto"><IconFileFilled class="w-16 h-16" /></span>
          }
        </div>

        <span class="border-b-2"></span>

        <span class="px-2 w-full shrink-0 flex items-center gap-1 truncate">
          {/* アップロードの進捗か結果表示 */}
          <span class="shrink-0 grow-0 text-sm w-4 h-4 text-center" style="font-family: 'consolas'">
            {result() === "" && <ProgressCircle value={progress()} class="w-4 h-4 mx-auto" /> }
            {result() === "SUCCESS" && "✅" }
            {result() === "内部エラー" && "!" }
            {result().startsWith("error::") && result() }
          </span>

          {/* ファイル名表示 */}
          <div class="shrink truncate">
            <HoverCard open={openFileNameCard()} onOpenChange={setOpenFileNameCard} >
              <HoverCardTrigger>
                <p onClick={()=>setOpenFileNameCard(true)} class="text-sm truncate">
                  { props.file.name }
                </p>
              </HoverCardTrigger>
              <HoverCardContent>
                { props.file.name }
              </HoverCardContent>
            </HoverCard>
          </div>

          {/* 削除ボタン */}
          <Button
            onClick={()=>props.onRemove && props.onRemove(fileIdBinded, props.file.name)}
            size={"icon"}
            variant={"ghost"}
            class={"ml-auto shrink-0"}
          >
            <IconSquareRoundedX />
          </Button>
        </span>
      </Card>
    </div>
  );
}