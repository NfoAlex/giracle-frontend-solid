import {IMessage} from "~/types/Message";
import {For} from "solid-js";
import {Card} from "~/components/ui/card";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"]}) {
  return (
    <div class={"flex items-center flex-wrap gap-1"}>
      <For each={props.reaction}>
        {
          (r)=> {
            //JSONを配列化
            const reaction = Object.entries(r);
            return (
              <Card class={"p-1 text-sm flex items-center gap-1"}>
                <span>{ reaction[0] }</span>
                <span>{ reaction[1] }</span>
              </Card>
            )
          }
        }
      </For>
    </div>
  )
}