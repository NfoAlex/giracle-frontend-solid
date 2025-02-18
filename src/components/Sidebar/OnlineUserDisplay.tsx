import {Dialog, DialogContent, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {storeUserOnline} from "~/stores/Userinfo";
import {Badge} from "~/components/ui/badge";
import {IconCircleFilled} from "@tabler/icons-solidjs";

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
          <p class="font-bold text-xl">オンラインユーザー</p>
        </DialogHeader>
        <p>オンラインユーザー : { storeUserOnline.toString() }</p>
      </DialogContent>
    </Dialog>
  )
}