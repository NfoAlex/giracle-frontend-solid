import { createEffect, createSignal, For, on, Show } from "solid-js";
import GET_MESSAGE_WHO_REACTED from "~/api/MESSAGE/MESSAGE_WHO_REACTED";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "~/components/ui/dialog";
import RenderEmoji from "~/components/unique/RenderEmoji";
import { getterUserinfo } from "~/stores/Userinfo";

// ToDo :: 指定した人数しかとれない
export default function DisplayAllReactedUserModal(props: { messageId: string, emojiCode: string, onOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const [reactedUserArrs, setReactedUserArrs] = createSignal<string[]>([]);
  
  /**
   * propsからの絵文字コード指定の更新を監視してデータ取得
   */
  createEffect(on(
    () => props.emojiCode,
    (emojiCode) => {
      if (props.emojiCode === "") return;
      GET_MESSAGE_WHO_REACTED(props.messageId, emojiCode)
        .then((res) => {
          setReactedUserArrs(res.data);
        })
        .catch((e) => console.error("DisplayAllReactedUserModal :: createEffect : e->", e))
    }
  ));
  
  return (
    <Dialog onOpenChange={props.onOpenChange} open={props.onOpen}>
      <DialogContent class="flex flex-col gap-2">
        <DialogHeader>
          <span class="flex items-center gap-2 my-2">
            <p>リアクションしたユーザー表示</p> <RenderEmoji emojiCode={props.emojiCode} />
          </span>
        </DialogHeader>
        <span class="grow shrink">
          <Show when={props.onOpen}>
            <For each={reactedUserArrs()}>
              {(userId) => {
                return (
                  <div>
                    { getterUserinfo(userId)?.name || "..." }
                  </div>
                )
              }}
            </For>
          </Show>
        </span>
      </DialogContent>
    </Dialog>
  )
}