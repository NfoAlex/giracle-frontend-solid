import type {IMessage} from "~/types/Message";
import {createEffect, createSignal, For, on, Show} from "solid-js";
import {Card} from "~/components/ui/card";
import DELETE_MESSAGE_DELETE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_DELETE_EMOJI_REACTION";
import POST_MESSAGE_EMOJI_REACTION from "~/api/MESSAGE/MESSAGE_EMOJI_REACTION";
import GET_MESSAGE_WHO_REACTED from "~/api/MESSAGE/MESSAGE_WHO_REACTED";
import RenderEmoji from "~/components/unique/RenderEmoji";
import { createMutable } from "solid-js/store";
import { getterUserinfo } from "~/stores/Userinfo";
import DisplayAllReactedUserModal from "./RenderEmojiReactions/DisplayAllReactedUserModal";
import { Button } from "~/components/ui/button";

export default function RenderEmojiReactions(props: {reaction: IMessage["reactionSummary"], messageId: string, channelId: string}) {
  //リアクションをしているユーザー取得のためのデータJSONと取得状態用JSON
  const reactedUserArrs = createMutable<{ [emojiCode:string]: string[] }>({});
  const statusFetchingEmojiCode = createMutable<{ [emojiCode:string]: boolean }>({});
  //ホバー状態に入っている絵文字コード
  const [hoveringEmojiCode, setHoverEmojiCode] = createSignal<string>("");

  //リアクションした人詳細表示モーダルのトリガー用
  const [dialogOpen, setDialogOpen] = createSignal(false);

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

  /**
   * 対象のリアクションをしているユーザーを取得する
   * @param messageId
   * @param emojiCode
   */
  const fetchReactedUser = async (emojiCode: string) => {
    //もしホバーをやめているなら停止
    if (hoveringEmojiCode() !== emojiCode) return;
    //指定の絵文字リアクションをしているユーザーを取得中の場合は何もしない
    statusFetchingEmojiCode[emojiCode] = true;
    if (reactedUserArrs[emojiCode]) return;
    //取得、格納
    GET_MESSAGE_WHO_REACTED(props.messageId, emojiCode)
      .then((res) => {
        reactedUserArrs[emojiCode] = res.data;
      })
      .catch((e) => console.error("RenderEmojiReactions :: fetchReactedUser : e->", e))
      .finally(() => statusFetchingEmojiCode[emojiCode] = false);
  }

  //リアクションデータの変更を監視してリアクションしたユーザーデータを初期化
  createEffect(
    on(
      () => props.reaction.map((r) => r.count).join(","),
      () => {
        if (props) {
          //リアクションしたユーザーを初期化
          for (const emojiCode in reactedUserArrs) {
            if (reactedUserArrs[emojiCode] !== undefined) {
              delete reactedUserArrs[emojiCode];
            }
          }
          //もしホバー中なら再取得させる
          if (hoveringEmojiCode() !== "") {
            fetchReactedUser(hoveringEmojiCode());
          }
        }
      }
    )
  );

  return (
    <div class={"py-1 flex items-center flex-wrap gap-1"}>
      <For each={props.reaction}>
        {
          (r)=> {
            return (
              <Card
                onClick={() => r.includingYou ? deleteReaction(r.emojiCode) : addReaction(r.emojiCode)}
                onMouseEnter={() =>
                  setTimeout(()=>{ setHoverEmojiCode(r.emojiCode); fetchReactedUser(r.emojiCode); }, 500)
                }
                onMouseLeave={() => setHoverEmojiCode("")}
                class={`relative p-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-accent hover:border-background border-accent ${r.includingYou ? "bg-accent border-primary" : ""}`}
              >
                <RenderEmoji emojiCode={r.emojiCode} />
                <span>{ r.count }</span>

                {/* ホバー表示 */}
                <Show when={hoveringEmojiCode() === r.emojiCode}>
                  <Card class="absolute bottom-full p-2 left-0 w-max max-w-52 z-50" onClick={(e) => e.stopPropagation()}>
                    <code>{ r.emojiCode }</code>
                    <hr class="my-1" />
                    <span class="flex flex-wrap gap-2">
                      { reactedUserArrs[r.emojiCode] !== undefined
                        ?
                          <>
                            <For each={reactedUserArrs[r.emojiCode]}>
                              {(userId) => {
                                return (
                                  <span class="text-sm text-primary">
                                    {getterUserinfo(userId)?.name ?? userId}
                                  </span>
                                )
                              }}
                            </For>
                            { //リアクションした人が5人以上いる場合はもっと見るボタンを表示(詳細モーダル表示)
                              reactedUserArrs[r.emojiCode].length >= 5 &&
                              <Button onClick={()=>setDialogOpen(true)} class="ml-auto" size={"sm"}>もっと見る</Button>
                            }
                          </>
                        :
                          <p>...</p>
                      }
                    </span>
                  </Card>
                </Show>
              </Card>
            )
          }
        }
      </For>

      <DisplayAllReactedUserModal messageId={props.messageId} emojiCode={hoveringEmojiCode()} onOpen={dialogOpen()} onOpenChange={setDialogOpen} />
    </div>
  )
}