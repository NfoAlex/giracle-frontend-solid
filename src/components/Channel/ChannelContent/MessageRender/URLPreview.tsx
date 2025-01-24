import type {IMessageUrlPreview} from "~/types/Message";
import {Card, CardContent} from "~/components/ui/card";
import {For} from "solid-js";

export default function URLPreview(props: { MessageUrlPreview: IMessageUrlPreview[] }) {
  return (
    <div>
      <For each={props.MessageUrlPreview}>
        {(urlPreview: IMessageUrlPreview) => (
          <Card>
            <CardContent>
              { urlPreview.title }
              { urlPreview.description }
            </CardContent>
          </Card>
        )}
      </For>
    </div>
  )
}