import { createEffect, createSignal, For, on } from "solid-js";
import { api } from "~/api/index.ts";
import { Avatar, AvatarImage } from "~/components/ui/avatar.tsx";
import { Dialog, DialogContent, DialogHeader } from "~/components/ui/dialog.tsx";
import RenderEmoji from "~/components/unique/RenderEmoji.tsx";
import { useStoreUserinfo } from "~/stores/Userinfo.store.ts";

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
      api.message.whoReacted({ messageId: props.messageId, emojiCode })
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
          <For each={reactedUserArrs()}>
            {(userId) => {
              return (
                <div class="px-2 flex items-center gap-2">
                  <Avatar class="w-8 h-8">
                    <AvatarImage
                      src={"/api/user/icon/" + useStoreUserinfo.getterUserinfo(userId)?.id}
                      alt={userId}
                    />
                  </Avatar>
                  <p>{ useStoreUserinfo.getterUserinfo(userId)?.name || "..." }</p>
                </div>
              )
            }}
          </For>
        </span>
      </DialogContent>
    </Dialog>
  )
}