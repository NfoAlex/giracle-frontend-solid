import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";
import {Card} from "~/components/ui/card";
import {IconCheck, IconPencil, IconX} from "@tabler/icons-solidjs";
import {createEffect, createSignal, on} from "solid-js";
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

  /**
   * チャンネル情報を更新する
   */
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
        //更新後の閲覧可能ロールを格納
        const roleIdArr = [...directGetterChannelInfo(props.channelId).ChannelViewableRole];
        setNewRoles(roleIdArr.map((r)=>r.roleId));
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
      <DialogContent class={"pt-10 w-full"}>
        <DialogHeader>
          <p>チャンネル情報の編集</p>
        </DialogHeader>
        <DialogDescription class={"flex flex-col gap-2"}>
          <Card class={"p-4"}>
            <Label class={"text-muted-foreground"}>チャンネル名</Label>
            <div class={"flex text-card-foreground items-center truncate"}>
              {
                editName()
                  ?
                  <div class={"w-full flex items-center gap-1"}>
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
                  : //forthedebuggingchannelforthedebuggingchannel
                  <div class={"shrink flex w-full items-center truncate overflow-x-auto"}>
                    <span class={"text-2xl grow shrink truncate"}>{ directGetterChannelInfo(props.channelId).name ?? "ロード中..." }</span>
                    <Button onClick={()=>setEditName(true)} variant={"outline"} class={"ml-auto border rounded-md h-10 w-10"}><IconPencil /></Button>
                  </div>
              }
            </div>

            <hr class={"my-4"} />

            <Label class={"text-muted-foreground"}>概要</Label>
            {
              !editDescription()
              ?
                <div class={"pt-3 pb-12 relative max-h-64 overflow-y-auto"}>
                    <p>{ directGetterChannelInfo(props.channelId).description }</p>
                    { directGetterChannelInfo(props.channelId).description==="" && <p class={"text-muted-foreground"}>概要が空です。</p> }

                    <Button onClick={()=>setEditDescription(true)} class={"absolute bottom-2 right-0 border rounded-md h-10 w-10"} variant={"outline"} ><IconPencil /></Button>
                </div>
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
          </Card>

          <hr class={"my-4"} />

          <Label>閲覧できるロール  {roleIsDiff() && "*"}</Label>
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