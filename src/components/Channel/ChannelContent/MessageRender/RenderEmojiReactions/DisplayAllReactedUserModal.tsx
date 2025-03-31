import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

// ToDo :: 指定した人数しかとれない
export default function DisplayAllReactedUserModal(props: { messageId: string }) {
  return (
    <Dialog>
      <DialogTrigger>
        <Button>もっと見る</Button>
      </DialogTrigger>
      <DialogContent>
        <p>ここで人表示</p>
      </DialogContent>
    </Dialog>
  )
}