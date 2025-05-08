import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTrigger} from "~/components/ui/dialog";
import {IconInfoCircle, IconPencil} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

export default function ChannelManage(props: {channelId: string}) {

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant={"secondary"} class={"w-9 h-9"}><IconPencil /></Button>
      </DialogTrigger>
      <DialogContent class={"pt-10 w-full"}>
        <DialogHeader>
          <p>チャンネル情報</p>
        </DialogHeader>
        <DialogDescription class={"flex flex-col gap-2"}>

          <Tabs defaultValue="info" class="w-full">
            <TabsList>
              <TabsTrigger value="info">概要</TabsTrigger>
              <TabsTrigger value="users">参加者</TabsTrigger>
            </TabsList>

            <TabsContent value="info">
              <p>ここで情報</p>
            </TabsContent>
            <TabsContent value="users">
              <p>ここで参加者</p>
            </TabsContent>
          </Tabs>
          
        </DialogDescription>
      </DialogContent>
    </Dialog>
  )
}