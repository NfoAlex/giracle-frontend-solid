import { createEffect, createSignal, on, Show } from "solid-js";
import GET_MESSAGE_WHO_REACTED from "~/api/MESSAGE/MESSAGE_WHO_REACTED";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "~/components/ui/dialog";

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
      <DialogContent>
        <DialogHeader>リアクションしたユーザー</DialogHeader>
        <Show when={props.onOpen}>
          <p>ここで人表示 : { props.emojiCode }</p>
          { reactedUserArrs().join(",") }
        </Show>
      </DialogContent>
    </Dialog>
  )
}