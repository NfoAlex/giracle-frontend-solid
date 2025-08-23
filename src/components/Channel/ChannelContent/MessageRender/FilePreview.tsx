import {IMessageFileAttached} from "~/types/Message";
import {Card} from "~/components/ui/card";
import {IconDownload} from "@tabler/icons-solidjs";
import ConvertSizeToHumanSize from "~/utils/ConvertSizeToHumanSize";
import {Button} from "~/components/ui/button";
import ImageWithModal from "~/components/unique/ImageWithModal";
import { storeImageDimensions } from "~/stores/History";
import { createSignal, onCleanup, onMount } from "solid-js";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "~/components/ui/hover-card";

export default function FilePreview(props: { file: IMessageFileAttached }) {
  const [openFileNameCard, setOpenFileNameCard] = createSignal(false); //ファイル名表示のHoverCardの開閉状態

  //ファイルをダウンロードする
  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = `/api/message/file/${props.file.id}`;
    link.download = props.file.actualFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  //画像以外のファイルの場合はここで表示して終わり
  if (!props.file.type.startsWith("image")) {
    return (
      <div class={"py-2 overflow-hidden"}>
        <Card class={"px-6 py-4 lg:w-1/2"}>
          <div class="flex items-center gap-2">

            <HoverCard open={openFileNameCard()} onOpenChange={setOpenFileNameCard}>
              <HoverCardTrigger>
                <p
                  onClick={() => setOpenFileNameCard(true)}
                  class={"truncate shrink grow-0 overflow-hidden text-wrap break-all line-clamp-1"}
                >
                  {props.file.actualFileName}
                </p>
              </HoverCardTrigger>
              <HoverCardContent>
                {props.file.actualFileName}
              </HoverCardContent>
            </HoverCard>

            <Card class={"ml-auto shrink-0 h-full p-2"}>{ ConvertSizeToHumanSize(props.file.size) }</Card>
            
            <Button onClick={downloadFile} size={"icon"} class={"shrink-0"} variant={"secondary"}>
              <IconDownload />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  //画像の縦幅、横幅
  const imageHeight = storeImageDimensions[props.file.id]?.height ?? 256;
  const imageWidth = storeImageDimensions[props.file.id]?.width ?? 256;
  //画像のサムネイルの高さと横幅を保持するSignal
  const [thumbnailDimension, setThumbnailDimension] = createSignal({ height: imageHeight, width: imageWidth });

  //画像のサムネイルの高さを画面と画像横幅を元に計算する関数
  const resizeHeight = () => {
    let calculatedHeight = imageHeight;
    //スマホUIかどうか調べる
    const mediaQuery = window.matchMedia('(max-width: 767px)');

    //サムネイル用高さを計算する(サイドバー分の256pxを引く、スマホUIなら引かない)
    const contentWidth= !mediaQuery.matches ? window.innerWidth - 256 : window.innerWidth;
    if ((imageWidth > contentWidth || imageHeight > imageWidth)) {
      calculatedHeight = imageHeight / (imageWidth / contentWidth); //サムネイルの高さを計算
    }

    setThumbnailDimension({
      height: calculatedHeight,
      width: imageWidth
    });
  }

  //ウィンドウのリサイズイベントにサムネイルの高さを再計算する関数を登録
  onMount(() => {
    window.addEventListener('resize', resizeHeight);
    
    onCleanup(() => {
      window.removeEventListener('resize', resizeHeight);
    });
  });

  //初期表示時にサムネイルの高さを計算
  resizeHeight();

  return (
    <div class={"py-2 overflow-hidden"}>
      <ImageWithModal
        src={`/api/message/file/${props.file.id}`}
        class="rounded max-w-full max-h-52 md:max-h-64"
        height={thumbnailDimension().height}
        width={thumbnailDimension().width}
      />
    </div>
  );
}
