import {IMessage} from "~/types/Message";
import {createEffect, createResource, For, on, onMount} from "solid-js";
import {Card} from "~/components/ui/card";
import { Database } from 'emoji-picker-element';
import {createMutable} from "solid-js/store";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"]}) {
  const db = new Database();
  const emojiToRender:{ [key: string]: string } = createMutable({})

  //props.reactionの長さの変更を検知して表示に使う絵文字データを取得、格納する
  createEffect(on(
    ()=>props.reaction.length.toString(),
    async () => {
      console.log("RenderEmojiReactions :: createEffect : props.reaction.length->", props.reaction.length);

      //リアクションデータごとに絵文字をレンダーする
      for (const r of props.reaction) {
        if (emojiToRender[r.emojiCode] !== undefined) continue;
        //データ取得、無ければ停止
        const emojiData = await db.getEmojiByShortcode(r.emojiCode);
        if (emojiData === null) return;

        console.log("RenderEmojiReactions :: getEmoji : 結果->", emojiData);
        //絵文字そのものを格納
        // @ts-ignore - 参照は正常にできている
        emojiToRender[r.emojiCode] = emojiData.unicode;
      }
    }
  ));

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