import {Card} from "~/components/ui/card";
import {createSignal, onMount} from "solid-js";
import {useParams} from "@solidjs/router";

export default function FilePreview(
  props: {
    file: File,
    dataSetter: (files: string) => void
  }
) {
  const params = useParams();
  const [progress, setProgress] = createSignal(0);
  const [isUploaded, setIsUploaded] = createSignal(false);

  /**
   * ファイルをアップロードする
   */
  const uploadFile = async () => {
    console.log("FilePreview :: uploadFile : props.file->", props.file, " : params.channelId->", params.channelId);

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
        console.log("FilePreview :: uploadFile : 成功!->", xhr.responseText);
        const result: { result: string; data: { fileId: string } } = JSON.parse(
          xhr.responseText,
        );
        //結果を格納
        setIsUploaded(true);
        //結果がちゃんと取れているなら親コンポにファイルIdを渡す
        if (result.data !== undefined) {
          props.dataSetter(result.data.fileId);
          setIsUploaded(true);
        } else {
          //エラーとして設定
          console.error("FilePreview :: uploadFile : 結果が取れていない->", result);
        }
      } else {
        console.error("FilePreview :: uploadFile : 失敗...->", xhr.statusText);
      }
    });

    //アップロード先のURLを指定
    xhr.open("POST", "/api/message/file/upload");
    //アップロードする
    xhr.send(formData);
  }

  onMount(() => uploadFile());

  return (
    <div>
      <Card class={"p-2 w-fit flex items-center"}>
        {progress()}
        <p> __ { props.file.name }</p>
      </Card>
    </div>
  );
}