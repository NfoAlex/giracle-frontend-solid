import type {IMessageUrlPreview} from "~/types/Message";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {For, Show} from "solid-js";
import ImageWithModal from "~/components/unique/ImageWithModal";
import VideoPlayerModal from "./URLPreview/VideoPlayerModal";
import { IconLink } from "@tabler/icons-solidjs";

export default function URLPreview(props: { MessageUrlPreview: IMessageUrlPreview[] }) {
  return (
    <div class={"py-1 flex flex-col gap-1"}>
      <For each={props.MessageUrlPreview}>
        {(urlPreview: IMessageUrlPreview) => (

          <Card class={"flex flex-col md:w-72 lg:w-96 sm:w-1/2 w-full"}>
            <div class={"border-b-2 grow relative"}>
              {/* 画像URLがある場合の表示 */}
              <div class="z-10 relative h-32 md:h-56 rounded-t flex flex-col items-center justify-center">
                <ImageWithModal class={"z-20 mx-auto h-full w-fit"} src={urlPreview.imageLink} />

                <div
                  class={"z-0 absolute inset-0 bg-cover bg-center filter blur-sm w-full h-full rounded-t"}
                  style={`background-image: url(${urlPreview.imageLink});`}
                ></div>
              </div>

              {/* 動画URLがある場合の表示 */}
              <Show when={urlPreview.videoLink && !urlPreview.videoLink.startsWith("https://www.youtube")}>
                <span class={"absolute bottom-3 right-3 shadow-xl"}>
                  <VideoPlayerModal urlPreview={urlPreview} />
                </span>
              </Show>
            </div>
            <CardHeader>
              <CardTitle class={"flex flex-row items-center gap-2"}>
                {
                  urlPreview.faviconLink
                  ?
                  <img class={"w-5 h-fit shrink-0"} src={urlPreview.faviconLink} alt="favicon" />
                  :
                  <IconLink />
                }
                <a href={urlPreview.url} target="_blank" rel="noreferrer" class="shrink line-clamp-2">
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