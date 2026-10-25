import { IconCheck, IconX, IconPencil, IconRefresh } from "@tabler/icons-solidjs";
import { createEffect, createSignal, on } from "solid-js";
import { api } from "~/api/index.ts";
import { Button } from "~/components/ui/button.tsx";
import { Card } from "~/components/ui/card.tsx";
import { Label } from "~/components/ui/label.tsx";
import { TextField, TextFieldInput, TextFieldTextArea } from "~/components/ui/text-field.tsx";
import RoleLinker from "~/components/unique/RoleLinker.tsx";
import ChannelIdDisplay from "./ChannelIdDisplay.tsx";
import { useStoreChannelInfo } from "~/stores/ChannelInfo.store.ts";
import { useStoreMyUserinfo } from "~/stores/MyUserinfo.store.ts";

export default function ChannelInfo(props: { channelId: string }) {
  const [editName, setEditName] = createSignal(false);
  const [editDescription, setEditDescription] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  const [newDescription, setNewDescription] = createSignal("");
  const [newRoles, setNewRoles] = createSignal<string[]>([])
  const [processing, setProcessing] = createSignal(false); //処理中表示用

  //閲覧可能ロールが変更されたかどうか
  const roleIsDiff = () => {
    const oldRoles = useStoreChannelInfo.directGetterChannelInfo(props.channelId).ChannelViewableRole.map((r) => r.roleId).join(",");
    return oldRoles !== newRoles().join(",");
  };

  const bindCurrentViewableRole = () => {
    const roleIdArr = [...useStoreChannelInfo.directGetterChannelInfo(props.channelId).ChannelViewableRole];
    setNewRoles(roleIdArr.map((r) => r.roleId));
  };

  /**
   * チャンネル情報を更新する
   */
  const updateChannel = () => {
    setProcessing(true);
    api.channel.update({
      name: newName() !== "" ? newName() : undefined,
      description: newDescription() !== "" ? newDescription() : undefined,
      viewableRole: roleIsDiff() ? newRoles() : undefined,
      channelId: props.channelId
    })
      .then((r) => {
        console.log(r);
        setEditDescription(false);
        setEditName(false);
        //更新後の閲覧可能ロールを格納
        const roleIdArr = [...useStoreChannelInfo.directGetterChannelInfo(props.channelId).ChannelViewableRole];
        setNewRoles(roleIdArr.map((r) => r.roleId));
      })
      .catch((e) => {
        console.error("ChannelManage :: updateChannel : e", e);
      })
      .finally(() => setProcessing(false));
  };

  //チャンネルを移動するごとに閲覧可能ロールを更新
  createEffect(on(() => props.channelId, () => {
    bindCurrentViewableRole();
  }));

  return (
    <div class="h-full flex flex-col gap-2">
      <Card class={"p-4 shrink flex flex-col"}>
        <Label class={"text-muted-foreground"}>チャンネル名</Label>
        <div class={"grow text-card-foreground w-full overflow-x-scroll"}>
          { //チャンネル名
            editName()
              ?
              <div class={"mt-2 w-full flex items-center gap-1"}>
                <TextField class={"grow-2"}>
                  <TextFieldInput
                    placeholder={"チャンネル名"}
                    value={useStoreChannelInfo.directGetterChannelInfo(props.channelId).name}
                    onInput={(e) => setNewName(e.currentTarget.value)}
                  />
                </TextField>
                <Button
                  onClick={updateChannel}
                  class={"ml-auto h-10 w-10"}
                  disabled={processing()}
                >
                  <IconCheck />
                </Button>
                <Button
                  onClick={() => setEditName(false)}
                  class={"ml-auto h-10 w-10"}
                  variant={"outline"}
                  disabled={processing()}
                >
                  <IconX />
                </Button>
              </div>
              :
              <div class={"flex items-center overflow-x-scroll gap-1"}>
                <span class={"shrink max-w-48 md:max-w-80 overflow-x-scroll"}>
                  <p class={"text-2xl truncate"}>{useStoreChannelInfo.directGetterChannelInfo(props.channelId).name ?? "ロード中..."}</p>
                </span>
                { //権限ある場合の編集ボタン
                  useStoreMyUserinfo.getRolePower("manageChannel")
                  &&
                  <Button
                    onClick={() => setEditName(true)}
                    variant={"outline"}
                    class={"ml-auto border rounded-md h-10 w-10"}
                    disabled={processing()}
                  >
                    <IconPencil />
                  </Button>
                }
              </div>
          }
        </div>

        <hr class={"my-2"} />

        <Label class={"text-muted-foreground"}>概要</Label>
        {
          !editDescription()
            ?
            <div class={"grow py-3 relative max-h-64 overflow-y-auto whitespace-pre-wrap break-words"}>
              <p>{useStoreChannelInfo.directGetterChannelInfo(props.channelId).description}</p>
              {useStoreChannelInfo.directGetterChannelInfo(props.channelId).description === "" && <p class={"text-muted-foreground"}>概要が空です。</p>}

              { //権限ある場合の編集ボタン
                useStoreMyUserinfo.getRolePower("manageChannel")
                &&
                <Button
                  onClick={() => setEditDescription(true)}
                  class={" float-right border rounded-md h-10 w-10 z-10"}
                  variant={"outline"}
                >
                  <IconPencil />
                </Button>
              }
            </div>
            :
            <div class={"mt-2 flex flex-col gap-1"}>
              <TextField class={"max-h-64 overflow-y-auto"}>
                <TextFieldTextArea
                  value={useStoreChannelInfo.directGetterChannelInfo(props.channelId).description}
                  onInput={(e) => setNewDescription(e.currentTarget.value)}
                />
              </TextField>
              <div class={"w-fit ml-auto p-2 flex items-center gap-1"}>
                <Button
                  onClick={updateChannel}
                  class={"border rounded-md h-10 w-10"}
                  disabled={processing()}
                >
                  <IconCheck />
                </Button>
                <Button
                  onClick={() => setEditDescription(false)}
                  class={"border rounded-md h-10 w-10"}
                  variant={"secondary"}
                  disabled={processing()}
                >
                  <IconX />
                </Button>
              </div>
            </div>
        }
      </Card>

      <Card class="p-2">
        <Label class="text-muted-foreground">閲覧できるロール  {roleIsDiff() && "*"}</Label>
        <RoleLinker
          roles={newRoles()}
          onUpdate={(roles) => setNewRoles(roles)}
        />
        <div class="flex items-center justify-end gap-1">
          { //権限がある場合のロール更新ボタン
            useStoreMyUserinfo.getRolePower("manageChannel")
            &&
            <>
              <Button
                onClick={bindCurrentViewableRole}
                size={"sm"}
                class={"md:w-fit w-1/2"}
                variant={"ghost"}
                disabled={!roleIsDiff() || processing()}
              >
                <IconRefresh />
                ロールを復元
              </Button>
              <Button
                onClick={updateChannel}
                size={"sm"}
                class={"md:w-fit w-1/2"}
                variant={"secondary"}
                disabled={!roleIsDiff() || processing()}
              >
                <IconCheck />
                ロールを更新
              </Button>
            </>
          }
        </div>
      </Card>

      <span class="mt-auto">
        <ChannelIdDisplay channelId={props.channelId} />
      </span>
    </div>
  );
}
