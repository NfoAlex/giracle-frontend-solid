import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "~/components/ui/dialog";

// ToDo :: 指定した人数しかとれない
export default function DisplayAllReactedUserModal(props: { messageId: string, emojiCode: string, onOpen: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog onOpenChange={props.onOpenChange} open={props.onOpen}>
      <DialogContent>
        <p>ここで人表示</p>
      </DialogContent>
    </Dialog>
  )
}