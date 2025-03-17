import { IconLink, IconPlayerPlayFilled } from "@tabler/icons-solidjs";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";
import type { IMessageUrlPreview } from "~/types/Message";

export default function VideoPlayerModal(props: { urlPreview: IMessageUrlPreview }) {

  if (props.urlPreview.videoLink === null) return null;

  return (
    <Dialog>

      <DialogTrigger>
        <Button size="icon">
          <IconPlayerPlayFilled />
        </Button>
      </DialogTrigger>

      <DialogContent class="width-fit height-fit p-0 pt-10 m-0 rounded-md">
        <div class="w-full flex items-center gap-2 px-6 truncate line-clamp-1">
          {
            props.urlPreview.faviconLink
            ?
            <img class={"w-4 h-fit shrink"} src={props.urlPreview.faviconLink} alt="favicon" />
            :
            <IconLink />
          }
          <p class="shrink truncate">{ props.urlPreview.title }</p>
        </div>

        <video
          height={"auto"}
          width={"auto"}
          src={props.urlPreview.videoLink}
          controls
          class="mx-auto"
        />
      </DialogContent>

    </Dialog>
  )
}