import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {IconInfoCircle, IconPencil} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import ChannelInfo from "./ChannelManage/ChannelInfos";
import ChannelMembers from "./ChannelManage/ChannelMembers";
import { getRolePower } from "~/stores/MyUserinfo";

export default function ChannelManage(props: {channelId: string}) {

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"secondary"} class={"w-9 h-9"}>
          { getRolePower("manageChannel") ? <IconPencil /> : <IconInfoCircle /> }
        </Button>
      </DialogTrigger>
      <DialogContent class={"pt-10 w-full"}>
        <DialogHeader>
          <p>チャンネル情報</p>
        </DialogHeader>
        <DialogDescription class={"flex flex-col gap-2"}>

          <Tabs defaultValue="info" class="w-full h-[450px]">
            <TabsList>
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