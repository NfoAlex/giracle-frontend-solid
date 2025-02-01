import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {Card} from "~/components/ui/card";
import {getRolePower} from "~/stores/MyUserinfo";
import {IconCheck, IconPencil, IconX} from "@tabler/icons-solidjs";
import {createEffect, createSignal, on, onMount} from "solid-js";
import {TextField, TextFieldInput, TextFieldTextArea} from "~/components/ui/text-field";
import {Button} from "~/components/ui/button";
import POST_CHANNEL_UPDATE from "~/api/CHANNEL/CHANNEL_UPDATE";
import RoleLinker from "~/components/unique/RoleLinker";
import {Label} from "~/components/ui/label";

export default function ChannelManage(props: {channelId: string}) {
  const [editName, setEditName] = createSignal(false);
  const [editDescription, setEditDescription] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");
  const [newRoles, setNewRoles] = createSignal<string[]>([]);

  //閲覧可能ロールが変更されたかどうか
  const roleIsDiff = () => {
    const oldRoles = directGetterChannelInfo(props.channelId).ChannelViewableRole.map((r)=>r.roleId).join(",");
    return oldRoles !== newRoles().join(",");
  }

  const updateChannel = () => {
    POST_CHANNEL_UPDATE({
      name: newName()!=="" ? newName() : undefined,
      description: newDescription()!=="" ? newDescription() : undefined,
      viewableRole: roleIsDiff() ? newRoles() : undefined,
      channelId: props.channelId
    })
      .then((r) => {
        console.log(r);
        setEditDescription(false);
        setEditName(false);
      })
      .catch((e) => {
        console.error("ChannelManage :: updateChannel : e", e);
      })
  }

  //チャンネルを移動するごとに閲覧可能ロールを更新
  createEffect(on(() => props.channelId, () => {
    const roleIdArr = [...directGetterChannelInfo(props.channelId).ChannelViewableRole];
    setNewRoles(roleIdArr.map((r)=>r.roleId));
  }));

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"secondary"} class={"w-9 h-9"}><IconPencil /></Button>
      </DialogTrigger>
      <DialogContent class={"pt-10"}>
        <DialogHeader>

        </DialogHeader>
        <DialogDescription class={"flex flex-col gap-2"}>
          <div class={"flex px-3 text-card-foreground items-center"}>
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
                  <Button onClick={updateChannel} class={"ml-auto h-10 w-10"}><IconCheck /></Button>
                  <Button onClick={()=>setEditName(false)} class={"ml-auto h-10 w-10"} variant={"outline"}><IconX /></Button>
                </div>
                :
                <p class={"text-2xl truncate"}>{ directGetterChannelInfo(props.channelId).name ?? "ロード中..." }</p>
            }
            { (getRolePower("manageChannel") && !editName()) && <Button onClick={()=>setEditName(true)} variant={"outline"} class={"ml-auto border rounded-md h-10 w-10"}><IconPencil /></Button> }
          </div>

          {
            !editDescription()
            ?
              <Card class={"px-3 pt-3 pb-12 relative max-h-64 overflow-y-auto"}>
                  <p>{ directGetterChannelInfo(props.channelId).description }</p>
                  { directGetterChannelInfo(props.channelId).description==="" && <p class={"text-muted-foreground"}>概要が空です。</p> }

                  <Button onClick={()=>setEditDescription(true)} class={"absolute bottom-2 right-2 border rounded-md h-10 w-10"} variant={"outline"} ><IconPencil /></Button>
              </Card>
            :
              <div class={"flex flex-col gap-1"}>
                <TextField class={"max-h-64 overflow-y-auto"}>
                  <TextFieldTextArea
                    value={directGetterChannelInfo(props.channelId).description}
                    onInput={(e)=>setNewDescription(e.currentTarget.value)}
                  />
                </TextField>
                <div class={"w-fit ml-auto p-2 flex items-center gap-1"}>
                  <Button onClick={updateChannel} class={"border rounded-md h-10 w-10"} ><IconCheck /></Button>
                  <Button onClick={()=>setEditDescription(false)} class={"border rounded-md h-10 w-10"} variant={"outline"} ><IconX /></Button>
                </div>
              </div>
          }

          <hr class={"my-4"} />

          <Label>閲覧できるロール</Label>
          <RoleLinker
            roles={newRoles()}
            onUpdate={(roles)=>setNewRoles(roles)}
          />
          <Button
            onClick={updateChannel}
            size={"sm"}
            class={"w-fit"}
            variant={"secondary"}
            disabled={!roleIsDiff()}
          >ロールを更新</Button>
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}