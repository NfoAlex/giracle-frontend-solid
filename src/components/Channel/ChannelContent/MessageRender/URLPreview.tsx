import type {IMessageUrlPreview} from "~/types/Message";
import {Card, CardContent, CardHeader, CardTitle} from "~/components/ui/card";
import {For} from "solid-js";

export default function URLPreview(props: { MessageUrlPreview: IMessageUrlPreview[] }) {
  return (
    <div class={"py-1 flex flex-col gap-1"}>
      <For each={props.MessageUrlPreview}>
        {(urlPreview: IMessageUrlPreview) => (
          <Card class={"md:w-1/3 sm:w-1/2"}>
            <img src={urlPreview.imageLink} alt={""} class={"rounded-t"} />
            <CardHeader class={"flex flex-row items-center gap-1"}>
              <img class={"w-4 h-fit"} src={urlPreview.faviconLink} alt="favicon" />
              <CardTitle>{ urlPreview.title }</CardTitle>
            </CardHeader>
            <CardContent>
              { urlPreview.description }
            </CardContent>
          </Card>
        )}
      </For>
    </div>
  )
}