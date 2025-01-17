import { Card } from "~/components/ui/card";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function ChannelBrowser() {
  return (
    <div class="p-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTrigger />
        <p>チャンネルブラウザ</p>
      </Card>
      ここでチャンネル一覧を表示
    </div>
  )
}
