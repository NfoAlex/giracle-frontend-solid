import {Dialog, DialogContent, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {getterUserinfo, storeUserOnline} from "~/stores/Userinfo";
import {Badge} from "~/components/ui/badge";
import {IconCircleFilled} from "@tabler/icons-solidjs";
import {For} from "solid-js";
import {Avatar, AvatarImage} from "~/components/ui/avatar";
import UserName from "~/components/unique/UserName";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";

export default function OnlineUserDisplay() {
  return (
    <Dialog>
      <DialogTrigger class={"w-full"}>
        <Badge variant={"secondary"} class={"w-full flex items-center px-3 py-2"}>
          <p>オンラインユーザー : </p>
          <span class={"ml-auto flex items-center gap-1"}>
            <IconCircleFilled color={"green"} size={16} />
            { storeUserOnline.length }
          </span>
        </Badge>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>

        </DialogHeader>

        <span class="font-bold text-xl flex">
          <p>オンラインユーザー</p>
          <Badge class={"ml-auto"}>{storeUserOnline.length}</Badge>
        </span>

        <hr/>

        <div class={"max-h-96 overflow-y-auto flex flex-col"}>
          <For each={storeUserOnline}>
            {(userId) => (
              <UserinfoModalWrapper userId={userId} class={"p-2 rounded-md flex items-center gap-2 hover:bg-accent"}>
                <Avatar class={"w-8 h-auto"}>
                  <AvatarImage src={`/api/user/icon/${userId}`}/>
                </Avatar>
                <p class={"truncate"}>
                  {getterUserinfo(userId).name}
                </p>
              </UserinfoModalWrapper>
            )}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  )
}