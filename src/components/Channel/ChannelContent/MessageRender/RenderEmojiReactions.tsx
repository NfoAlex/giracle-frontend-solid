import {IMessage} from "~/types/Message";
import {For, onMount} from "solid-js";
import {Card} from "~/components/ui/card";
import { Database } from 'emoji-picker-element';
import {createMutable} from "solid-js/store";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"]}) {
  const db = new Database();
  const emojiToRender:{ [key: string]: string } = createMutable({})

  onMount(async () => {
    //リアクションデータごとに絵文字をレンダーする
    for (const r of props.reaction) {
      //データ取得、無ければ停止
      const emojiData = await db.getEmojiByShortcode(r.emojiCode);
      if (emojiData === null) return;

      console.log("RenderEmojiReactions :: getEmoji : 結果->", emojiData);
      //絵文字そのものを格納
      // @ts-ignore - 参照は正常にできている
      emojiToRender[r.emojiCode] = emojiData.unicode;
    }
  })

  return (
    <div class={"py-1 flex items-center flex-wrap gap-1"}>
      <For each={props.reaction}>
        {
          (r)=> {
            return (
              <Card
                class={`p-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-accent hover:border-background border-accent ${r.includingYou ? "bg-accent border-primary" : ""}`}
              >
                <span>{ emojiToRender[r.emojiCode]!==undefined ? emojiToRender[r.emojiCode] : r.emojiCode.slice(0,5) }</span>
                <span>{ r.count }</span>
              </Card>
            )
          }
        }
      </For>
    </div>
  )
}