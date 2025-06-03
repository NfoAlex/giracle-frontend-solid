import {IMessageFileAttached} from "~/types/Message";
import {Card} from "~/components/ui/card";
import {IconDownload} from "@tabler/icons-solidjs";
import {Badge} from "~/components/ui/badge";
import ConvertSizeToHumanSize from "~/utils/ConvertSizeToHumanSize";
import {Button} from "~/components/ui/button";
import ImageWithModal from "~/components/unique/ImageWithModal";
import { storeImageDimensions } from "~/stores/History";

export default function FilePreview(props: { file: IMessageFileAttached }) {

  //ファイルをダウンロードする
  const downloadFile = () => {
    const link = document.createElement("a");
    link.href = `/api/message/file/${props.file.id}`;
    link.download = props.file.actualFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div class={"py-2 overflow-hidden"}>
      {
        props.file.type.startsWith("image")
        ?
          <ImageWithModal
            src={`/api/message/file/${props.file.id}`}
            class="max-w-1/3 max-h-64 rounded"
            height={storeImageDimensions[props.file.id]?.height}
            width={storeImageDimensions[props.file.id]?.width}
          />
        :
          <Card class={"px-6 py-4 lg:w-1/2"}>
            <div class="flex items-center gap-2">
              <p class={"truncate shrink grow-0 overflow-hidden text-wrap break-all line-clamp-1"}>{props.file.actualFileName}</p>

              <Badge class={"shrink-0 ml-auto"}>{ ConvertSizeToHumanSize(props.file.size) }</Badge>
              <Button onClick={downloadFile} size={"icon"} class={"shrink-0"} variant={"secondary"}>
                <IconDownload />
              </Button>
            </div>
          </Card>
      }
    </div>
  )
}