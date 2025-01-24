import {IMessageFileAttached} from "~/types/Message";
import {Card} from "~/components/ui/card";

export default function FilePreview(props: { file: IMessageFileAttached }) {
  return (
    <div class={"py-2"}>
      {
        props.file.type.startsWith("image")
        ?
          <img
            src={`/api/message/file/${props.file.id}`}
            class="max-w-1/3 max-h-64 rounded"
            alt={props.file.savedFileName}
          />
        :
          <Card class={"px-6 py-4"}>
            <div class="flex items-center">
              <p>{props.file.actualFileName}</p>
            </div>
          </Card>
      }
    </div>
  )
}