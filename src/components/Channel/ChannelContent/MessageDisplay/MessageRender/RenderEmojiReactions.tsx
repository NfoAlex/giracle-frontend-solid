import { createEffect, createSignal, For, on, onCleanup, Show } from "solid-js";
import { createMutable } from "solid-js/store";
import { api } from "~/api/index.ts";
import { Badge } from "~/components/ui/badge.tsx";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import RenderEmoji from "~/components/unique/RenderEmoji.tsx";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";
import type { IMessage } from "~/types/Message.ts";
import DisplayAllReactedUserModal from "./RenderEmojiReactions/DisplayAllReactedUserModal.tsx";

export default function RenderEmojiReactions(props: {
  reaction: IMessage["reactionSummary"];
  messageId: string;
  channelId: string;
}) {
  //リアクションをしているユーザー取得のためのデータJSON
  const reactedUserArrs = createMutable<{ [emojiCode: string]: string[] }>({});
  //ホバー状態に入っている絵文字コード
  const [hoveringEmojiCode, setHoverEmojiCode] = createSignal<string>("");
  //ホバー時の遅延取得タイマー(マウスが離れたら解除する)
  let hoverTimerId: ReturnType<typeof setTimeout> | undefined;
  //whoReactedのリクエスト世代(古いレスポンスの書き込みを防ぐ)
  let fetchGeneration = 0;

  //破棄時に保留中のホバー取得を止める
  onCleanup(() => clearTimeout(hoverTimerId));

  //リアクションした人詳細表示モーダルのトリガー用
  const [dialogOpen, setDialogOpen] = createSignal(false);

  /**
   * リアクションを削除する
   * @param emojiCode
   */
  const deleteReaction = async (emojiCode: string) => {
    api.message
      .deleteEmojiReaction({
        messageId: props.messageId,
        channelId: props.channelId,
        emojiCode,
      })
      .catch((e) =>
        console.error("RenderEmojiReactions :: deleteReaction : e->", e),
      );
  };

  /**
   * リアクションを追加する
   * @param emojiCode
   */
  const addReaction = async (emojiCode: string) => {
    api.message
      .emojiReaction({
        messageId: props.messageId,
        channelId: props.channelId,
        emojiCode,
      })
      .catch((e) => {
        console.error("EmojiPicker :: emojiClickHandler : e->", e);
      });
  };

  /**
   * 対象のリアクションをしているユーザーを取得する
   * @param messageId
   * @param emojiCode
   */
  const fetchReactedUser = async (emojiCode: string) => {
    //もしホバーをやめているなら停止
    if (hoveringEmojiCode() !== emojiCode) return;
    //キャッシュが既にある場合は何もしない
    if (reactedUserArrs[emojiCode]) return;
    //取得、格納(最後に発行したリクエストの結果だけを反映する)
    const generation = ++fetchGeneration;
    api.message
      .whoReacted({ messageId: props.messageId, emojiCode })
      .then((res) => {
        if (generation !== fetchGeneration) return;
        reactedUserArrs[emojiCode] = res.data;
      })
      .catch((e) =>
        console.error("RenderEmojiReactions :: fetchReactedUser : e->", e),
      );
  };

  //リアクションデータの変更を監視して、変化した絵文字の取得済みユーザーデータのみ初期化
  //(emojiCode にカンマやコロンが含まれうるため区切りは "|" と ",")
  createEffect(
    on(
      () =>
        props.reaction
          .map((r) => `${r.emojiCode}|${r.count}|${r.includingYou}`)
          .join(","),
      (_, prevKey) => {
        const prevStateMap = new Map(
          (prevKey ?? "")
            .split(",")
            .filter(Boolean)
            .map((s) => {
              const [emojiCode, count, includingYou] = s.split("|");
              return [emojiCode, `${count}|${includingYou}`];
            }),
        );

        for (const r of props.reaction) {
          if (
            prevStateMap.get(r.emojiCode) !== `${r.count}|${r.includingYou}`
          ) {
            delete reactedUserArrs[r.emojiCode];
          }
        }

        //もしホバー中なら再取得させる
        if (hoveringEmojiCode() !== "") {
          fetchReactedUser(hoveringEmojiCode());
        }
      },
    ),
  );

  return (
    <div class={"py-1 flex items-center flex-wrap gap-1"}>
      <For each={props.reaction}>
        {(r) => {
          return (
            <Card
              onClick={() =>
                r.includingYou
                  ? deleteReaction(r.emojiCode)
                  : addReaction(r.emojiCode)
              }
              onMouseEnter={() => {
                setHoverEmojiCode(r.emojiCode);
                clearTimeout(hoverTimerId);
                hoverTimerId = setTimeout(() => {
                  if (hoveringEmojiCode() !== "") fetchReactedUser(r.emojiCode);
                }, 500);
              }}
              onMouseLeave={() => {
                setHoverEmojiCode("");
                clearTimeout(hoverTimerId);
                hoverTimerId = undefined;
              }}
              class={`select-none relative p-1 text-sm flex items-center gap-1 cursor-pointer hover:bg-accent hover:border-background border-accent ${r.includingYou ? "bg-accent border-primary" : ""}`}
            >
              <RenderEmoji emojiCode={r.emojiCode} />
              <span>{r.count}</span>

              {/* ホバー表示 */}
              <Show when={hoveringEmojiCode() === r.emojiCode}>
                <Card
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => e.stopPropagation()}
                  class="absolute bottom-full p-2 left-0 w-max max-w-52 z-50 cursor-default"
                >
                  <span class="flex items-center gap-1">
                    <span class="shrink-0">
                      <RenderEmoji emojiCode={r.emojiCode} />
                    </span>
                    <p class="line-clamp-2 overflow-x-auto">{r.emojiCode}</p>
                  </span>
                  <hr class="my-1" />
                  <span class="flex flex-wrap gap-1">
                    {reactedUserArrs[r.emojiCode] !== undefined ? (
                      <>
                        <For each={reactedUserArrs[r.emojiCode]}>
                          {(userId) => {
                            return (
                              <span class="text-sm text-primary">
                                <Badge variant={"secondary"}>
                                  {useStoreUserinfo.getterUserinfo(userId)
                                    ?.name ?? userId}
                                </Badge>
                              </span>
                            );
                          }}
                        </For>

                        {/* 改行用 */}
                        <span class="w-full"></span>
                        {
                          //リアクションした人が5人以上いる場合はもっと見るボタンを表示(詳細モーダル表示)
                          reactedUserArrs[r.emojiCode].length >= 5 && (
                            <Button
                              onClick={() => setDialogOpen(true)}
                              class="w-full cursor-pointer"
                              size={"sm"}
                            >
                              もっと見る
                            </Button>
                          )
                        }
                      </>
                    ) : (
                      <p>...</p>
                    )}
                  </span>
                </Card>
              </Show>
            </Card>
          );
        }}
      </For>

      <Show when={dialogOpen()}>
        <DisplayAllReactedUserModal
          messageId={props.messageId}
          emojiCode={hoveringEmojiCode()}
          onOpen={dialogOpen()}
          onOpenChange={setDialogOpen}
        />
      </Show>
    </div>
  );
}
