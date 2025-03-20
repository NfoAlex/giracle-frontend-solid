import type {IMessage} from "~/types/Message";
import {For} from "solid-js";
import {Card} from "~/components/ui/card";
import DELETE_MESSAGE_DELETE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_DELETE_EMOJI_REACTION";
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION";
import RenderEmoji from "~/components/unique/RenderEmoji";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"], messageId: string, channelId: string}) {
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
                <RenderEmoji emojiCode={r.emojiCode} />
                <span>{ r.count }</span>
              </Card>
            )
          }
        }
      </For>
    </div>
  )
}