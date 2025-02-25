import {IMessage} from "~/types/Message";
import {For, onMount} from "solid-js";
import {Card} from "~/components/ui/card";
import { Database } from 'emoji-picker-element';
import {createMutable} from "solid-js/store";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"]}) {
  const db = new Database();
  const emojiToRender:{ [key: string]: number } = createMutable({})

  onMount(async () => {
    //リアクションデータごとに絵文字をレンダーする
    for (const r of props.reaction) {
      //コード取得
      const code = Object.entries(r)[0][0];
      //データ取得、無ければ停止
      const emojiData = await db.getEmojiByShortcode(code);
      if (emojiData === null) return code;

      //console.log("RenderEmojiReactions :: getEmoji : 結果->", emojiData);
      //絵文字そのものを格納
      // @ts-ignore - 参照は正常にできている
      emojiToRender[code] = emojiData.unicode;
    }
  })

  return (
    <div class={"py-1 flex items-center flex-wrap gap-1"}>
      <For each={props.reaction}>
        {
          (r)=> {
            //JSONを配列化しｔｒ表示する
            const reaction = Object.entries(r);
            return (
              <Card class={"p-1 text-sm flex items-center gap-1"}>
                <span>{ emojiToRender[reaction[0][0]]!==undefined ? emojiToRender[reaction[0][0]] : reaction[0][0].slice(0,5) }</span>
                <span>{ reaction[0][1] }</span>
              </Card>
            )
          }
        }
      </For>
    </div>
  )
}