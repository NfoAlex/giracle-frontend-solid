import {IMessage} from "~/types/Message";
import {createEffect, For, on, Show} from "solid-js";
import {Card} from "~/components/ui/card";
import {createMutable} from "solid-js/store";
import DELETE_MESSAGE_DELETE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_DELETE_EMOJI_REACTION";
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION";
import {emojiDB} from "~/stores/CustomEmoji";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"], messageId: string, channelId: string}) {

  const emojiToRender:{ [key: string]: string } = createMutable({});
  const urlToRender:{ [key: string]: string } = createMutable({});

  /**
   * リアクションを削除する
   * @param emojiCode
   */
  const deleteReaction = async (emojiCode: string) => {
    DELETE_MESSAGE_DELETE_EMOJI_REACTION(props.messageId, props.channelId, emojiCode)
      .catch((e) => console.error("RenderEmojiReactions :: deleteReaction : e->", e));
  }

  /**
   * リアクションを追加する
   * @param emojiCode
   */
  const addReaction = async (emojiCode: string) => {
    POST_MESSAGE_EMOJI_REACTION(props.messageId, props.channelId, emojiCode)
      .catch((e) => {
        console.error("EmojiPicker :: emojiClickHandler : e->", e)
      });
  }

  //props.reactionの長さの変更を検知して表示に使う絵文字データを取得、格納する
  createEffect(on(
    ()=>props.reaction.length.toString(),
    async () => {
      //console.log("RenderEmojiReactions :: createEffect : props.reaction.length->", props.reaction.length);

      //リアクションデータごとに絵文字をレンダーする
      for (const r of props.reaction) {
        if (emojiToRender[r.emojiCode] !== undefined) continue;
        //データ取得、無ければ停止
        const emojiData = await emojiDB.getEmojiByShortcode(r.emojiCode);
        if (emojiData === null) continue;

        //console.log("RenderEmojiReactions :: createEffect : emojiData->", emojiData);
        //カスタム絵文字だとURLがあるのでそれを使う
        // @ts-ignore - 参照は正常にできている
        if (emojiData.url !== undefined) {
          //絵文字のURLを格納
          // @ts-ignore - 参照は正常にできている
          urlToRender[r.emojiCode] = emojiData.url;
          continue;
        }

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
                onClick={() => r.includingYou ? deleteReaction(r.emojiCode) : addReaction(r.emojiCode)}
                class={`p-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-accent hover:border-background border-accent ${r.includingYou ? "bg-accent border-primary" : ""}`}
              >
                <Show when={emojiToRender[r.emojiCode]!==undefined}>
                  <span>{ emojiToRender[r.emojiCode]!==undefined ? emojiToRender[r.emojiCode] : r.emojiCode.slice(0,5) }</span>
                </Show>
                <Show when={urlToRender[r.emojiCode]!==undefined}>
                  <img src={urlToRender[r.emojiCode]} alt={r.emojiCode} class={"w-5 h-5"} />
                </Show>
                <Show when={urlToRender[r.emojiCode]===undefined && emojiToRender[r.emojiCode]===undefined}>
                  <span>{ r.emojiCode.length > 5 ? r.emojiCode.slice(0,5) + "..." : r.emojiCode }</span>
                </Show>
                <span>{ r.count }</span>
              </Card>
            )
          }
        }
      </For>
    </div>
  )
}