import { IconInfoCircle, IconPencil } from "@tabler/icons-solidjs";
import { Button } from "~/components/ui/button.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger } from "~/components/ui/dialog.tsx";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs.tsx";
import { getRolePower } from "~/stores/MyUserinfo.ts";
import ChannelInfo from "./ChannelManage/ChannelInfos.tsx";
import ChannelMembers from "./ChannelManage/ChannelMembers.tsx";

export default function ChannelManage(props: { channelId: string }) {

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"secondary"} class={"w-9 h-9"}>
          {getRolePower("manageChannel") ? <IconPencil /> : <IconInfoCircle />}
        </Button>
      </DialogTrigger>
      <DialogContent class={"flex flex-col gap-0 pt-10 w-full h-3/4"}>
        <DialogHeader>
          <p>チャンネル情報</p>
        </DialogHeader>
        <DialogDescription class={"overflow-x-hidden w-full h-full shrink"}>

          <Tabs defaultValue="info" class="w-full">
            <TabsList class="w-fit">
              <TabsTrigger value="info">概要</TabsTrigger>
              <TabsTrigger value="users">参加者</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <ChannelInfo channelId={props.channelId} />
            </TabsContent>
            <TabsContent value="users">
              <ChannelMembers channelId={props.channelId} />
            </TabsContent>
          </Tabs>

        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}
