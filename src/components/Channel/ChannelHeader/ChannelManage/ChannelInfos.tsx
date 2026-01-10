import { IconCheck, IconX, IconPencil } from "@tabler/icons-solidjs";
import { createEffect, createSignal, on } from "solid-js";
import POST_CHANNEL_UPDATE from "~/api/CHANNEL/CHANNEL_UPDATE.ts";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Label } from "~/components/ui/label.tsx";
import { TextField, TextFieldInput, TextFieldTextArea } from "~/components/ui/text-field.tsx";
import RoleLinker from "~/components/unique/RoleLinker.tsx";
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { getRolePower } from "~/stores/MyUserinfo.ts";

export default function ChannelInfo(props: {channelId: string}) {
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
    <div class="mt-2">
      <Card class={"p-4"}>
        <Label class={"text-muted-foreground"}>チャンネル名</Label>
        <div class={"text-card-foreground w-full overflow-x-scroll"}>
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
              :
              <div class={"flex items-center overflow-x-scroll gap-1"}>
                <span class={"shrink max-w-48 md:max-w-80 overflow-x-scroll"}>
                  <p class={"text-2xl truncate"}>{ directGetterChannelInfo(props.channelId).name ?? "ロード中..." }</p>
                </span>
                { //権限ある場合の編集ボタン
                  getRolePower("manageChannel") 
                  &&
                  <Button onClick={()=>setEditName(true)} variant={"outline"} class={"ml-auto border rounded-md h-10 w-10"}><IconPencil /></Button>
                }
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

                { //権限ある場合の編集ボタン
                  getRolePower("manageChannel")
                  &&
                  <Button onClick={()=>setEditDescription(true)} class={"absolute bottom-2 right-0 border rounded-md h-10 w-10"} variant={"outline"} ><IconPencil /></Button>
                }
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
      { //権限がある場合のロール更新ボタン
        getRolePower("manageChannel")
        &&
        <Button
          onClick={updateChannel}
          size={"sm"}
          class={"w-fit mt-2"}
          variant={"secondary"}
          disabled={!roleIsDiff()}
        >ロールを更新</Button>
      }
    </div>
  );
}