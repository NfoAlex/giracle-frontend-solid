import type {IMessageUrlPreview} from "~/types/Message";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {For} from "solid-js";

export default function URLPreview(props: { MessageUrlPreview: IMessageUrlPreview[] }) {
  return (
    <div class={"py-1 flex flex-col gap-1"}>
      <For each={props.MessageUrlPreview}>
        {(urlPreview: IMessageUrlPreview) => (
          <Card class={"flex flex-col md:w-1/2 lg:w-1/4 sm:w-1/2 w-full"}>
            <div class={"border-b-2 grow"}>
              <img src={urlPreview.imageLink} alt={urlPreview.imageLink} class={"mx-auto rounded-t max-h-32 w-full object-cover"} />
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