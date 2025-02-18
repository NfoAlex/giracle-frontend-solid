import type {IMessageUrlPreview} from "~/types/Message";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {For} from "solid-js";
import ImageWithModal from "~/components/unique/ImageWithModal";

export default function URLPreview(props: { MessageUrlPreview: IMessageUrlPreview[] }) {
  return (
    <div class={"py-1 flex flex-col gap-1"}>
      <For each={props.MessageUrlPreview}>
        {(urlPreview: IMessageUrlPreview) => (
          <Card class={"flex flex-col md:w-72 lg:w-96 sm:w-1/2 w-full"}>
            <div class={"border-b-2 grow"}>
              <ImageWithModal class={"mx-auto rounded-t max-h-32 md:max-h-fit w-fit object-cover"} src={urlPreview.imageLink} />
            </div>
            <CardHeader class={"flex flex-row items-center gap-1"}>
              {urlPreview.faviconLink && <img class={"w-4 h-fit shrink"} src={urlPreview.faviconLink} alt="favicon" />}
              <CardTitle>
                <a href={urlPreview.url} target="_blank" rel="noreferrer">
                  {urlPreview.title}
                </a>
              </CardTitle>
            </CardHeader>
            <CardContent class={"whitespace-pre-wrap break-all"}>
              { urlPreview.description }
            </CardContent>
          </Card>
        )}
      </For>
    </div>
  )
}