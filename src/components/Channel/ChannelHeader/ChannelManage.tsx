import {Dialog} from "@kobalte/core/dialog";
import {DialogContent, DialogDescription, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {Button} from "@kobalte/core/button";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {Card} from "~/components/ui/card";
import {getRolePower} from "~/stores/MyUserinfo";
import {IconCancel, IconCheck, IconPencil, IconX} from "@tabler/icons-solidjs";
import {createSignal} from "solid-js";
import {TextField, TextFieldInput, TextFieldTextArea} from "~/components/ui/text-field";
import {TextArea} from "@kobalte/core/text-field";

export default function ChannelManage(props: {channelId: string}) {
  const [editName, setEditName] = createSignal(false);
  const [editDescription, setEditDescription] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");

  return (
    <Dialog>
      <DialogTrigger>
        <Button>管理</Button>
      </DialogTrigger>
      <DialogContent class={"pt-10"}>
        <DialogHeader class={"flex flex-row items-center w-11/12"}>
          {
            editName()
            ?
              <div class={"flex items-center gap-1 w-full"}>
                <TextField class={"grow"}>
                  <TextFieldInput
                    placeholder={"チャンネル名"}
                    value={directGetterChannelInfo(props.channelId).name}
                    onInput={(e)=>setNewName(e.currentTarget.value)}
                  />
                </TextField>
                <Button class={"ml-auto"}><IconCheck /></Button>
                <Button onClick={()=>setEditName(false)} class={"ml-auto"}><IconX /></Button>
              </div>
            :
              <p class={"text-2xl truncate"}>{ directGetterChannelInfo(props.channelId).name ?? "ロード中..." }</p>
          }
          { (getRolePower("manageChannel") && !editName()) && <Button onClick={()=>setEditName(true)} class={"ml-auto border p-2 rounded-md"}><IconPencil /></Button> }
        </DialogHeader>
        <DialogDescription>
          {
            !editDescription()
            ?
              <Card class={"px-3 pt-3 pb-12 relative max-h-64 overflow-y-auto"}>
                  <p>{ directGetterChannelInfo(props.channelId).description ?? "概要" }</p>
                { directGetterChannelInfo(props.channelId).description==="" && <p class={"text-muted-foreground"}>概要が空です。</p> }

                  <Button onClick={()=>setEditDescription(true)} class={"absolute bottom-2 right-2 p-2 border rounded-md"} ><IconPencil /></Button>
              </Card>
            :
              <div class={"flex flex-col gap-2"}>
                <TextField class={"max-h-64 overflow-y-auto"}>
                  <TextFieldTextArea
                    value={directGetterChannelInfo(props.channelId).description}
                    onInput={(e)=>setNewDescription(e.currentTarget.value)}
                  />
                </TextField>
                <Card class={"w-fit ml-auto p-2 flex items-center gap-1"}>
                  <Button onClick={()=>setEditDescription(false)} class={"border rounded-md"} ><IconCheck /></Button>
                  <Button onClick={()=>setEditDescription(false)} class={"border rounded-md"} ><IconX /></Button>
                </Card>
              </div>
          }
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}