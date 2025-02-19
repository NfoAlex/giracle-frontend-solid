import {Card} from "~/components/ui/card";
import {Button} from "~/components/ui/button";
import {IconCancel, IconCheck} from "@tabler/icons-solidjs";

export default function EditMessage(props: { messageId: string, content: string, onCancelEdit: () => void }) {
  return (
    <Card class={"p-2 flex flex-col gap-2"}>
      <div>EDIT_MESSAGE</div>
      <hr />
      <span class={"flex items-center gap-2 justify-end"}>
        <Button><IconCheck />更新する</Button>
        <Button onClick={props.onCancelEdit} variant={"secondary"}><IconCancel />キャンセル</Button>
      </span>
    </Card>
  )
}