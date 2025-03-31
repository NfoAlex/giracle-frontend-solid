import { createEffect, createSignal, For, on, Show } from "solid-js";
import GET_MESSAGE_WHO_REACTED from "~/api/MESSAGE/MESSAGE_WHO_REACTED";
import { Avatar, AvatarImage } from "~/components/ui/avatar";
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
      GET_MESSAGE_WHO_REACTED(props.messageId, emojiCode, 100)
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
        
        <hr />

        <span class="grow shrink flex flex-col gap-2 overflow-y-auto">
          <Show when={props.onOpen}>
            <For each={reactedUserArrs()}>
              {(userId) => {
                return (
                  <div class="px-2 flex items-center gap-2">
                    <Avatar class="w-8 h-8">
                      <AvatarImage
                        src={"/api/user/icon/" + getterUserinfo(userId)?.id}
                        alt={userId}
                      />
                    </Avatar>
                    <p>{ getterUserinfo(userId)?.name || "..." }</p>
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