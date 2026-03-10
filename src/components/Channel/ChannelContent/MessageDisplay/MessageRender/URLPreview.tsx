import type { IMessageUrlPreview } from "~/types/Message.ts";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card.tsx";
import { createSignal, Show } from "solid-js";
import ImageWithModal from "~/components/unique/ImageWithModal.tsx";
import VideoPlayerModal from "./URLPreview/VideoPlayerModal.tsx";
import { IconLink } from "@tabler/icons-solidjs";
import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Button } from "~/components/ui/button.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog.tsx";

export default function URLPreview(props: { urlPreview: IMessageUrlPreview }) {
  const [open, setOpen] = createSignal(false);

  return (
    <div class={"py-1 flex flex-col gap-1"}>

      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent class="pt-8 flex flex-col gap-0">
          <DialogHeader class="my-4 flex flex-col gap-4">
            {
              props.urlPreview.imageLink
              &&
              <ImageWithModal class={"border rounded w-full h-52 object-cover"} src={props.urlPreview.imageLink} />
            }
            <div class="flex items-center gap-2">
              {
                props.urlPreview.faviconLink
                  ? <img class={"w-5 h-fit shrink-0 truncate"} src={props.urlPreview.faviconLink} alt="favicon" />
                  : <IconLink />
              }
              <DialogTitle class="truncate">{props.urlPreview.title}</DialogTitle>
            </div>
          </DialogHeader>

          <hr />

          <div class="max-h-96 overflow-y-auto pt-4">
            <p class="whitespace-pre-wrap break-all">{props.urlPreview.description}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Card class={"flex flex-col md:w-72 lg:w-96 sm:w-1/2 w-full"}>
        <div class={"border-b-2 grow relative"}>
          {/* 画像URLがある場合の表示 */}
          <div class="z-10 relative h-28 md:h-52 rounded-t flex flex-col items-center justify-center">
            <ImageWithModal class={"rounded z-20 mx-auto my-auto max-w-full max-h-full"} src={props.urlPreview.imageLink} />

            <div
              class={"z-0 absolute inset-0 bg-cover bg-center filter blur-sm w-full h-full rounded-t"}
              style={`background-image: url(${props.urlPreview.imageLink});`}
            ></div>

            {/* 動画URLがある場合の表示 */}
            <Show when={props.urlPreview.videoLink && !props.urlPreview.videoLink.startsWith("https://www.youtube")}>
              <span class={"absolute bottom-3 right-3 shadow-xl z-50"}>
                <VideoPlayerModal urlPreview={props.urlPreview} />
              </span>
            </Show>
          </div>
        </div>
        <CardHeader class="p-4">
          <CardTitle class={"flex flex-row items-center gap-2"}>
            {
              props.urlPreview.faviconLink
                ?
                <img class={"w-5 h-fit shrink-0 truncate"} src={props.urlPreview.faviconLink} alt="favicon" />
                :
                <IconLink />
            }
            <a href={props.urlPreview.url} target="_blank" rel="noreferrer" class="shrink line-clamp-2">
              {props.urlPreview.title}
            </a>
          </CardTitle>
        </CardHeader>
        <hr />
        <CardContent class={"whitespace-pre-wrap break-all p-4"}>
          <p>
            {
              props.urlPreview.description.length >= storeClientConfig.display.maxUrlPreviewTextLength
                ?
                props.urlPreview.description.slice(0, storeClientConfig.display.maxUrlPreviewTextLength) + "..."
                :
                props.urlPreview.description
            }
          </p>
          <Button
            onClick={() => setOpen(true)}
            size={"sm"}
            class="ml-auto mt-2"
            variant={"ghost"}
          >全文を表示</Button>
        </CardContent>
      </Card>

    </div>
  )
}
