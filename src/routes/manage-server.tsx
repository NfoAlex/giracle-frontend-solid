import { createSignal } from "solid-js";
import ManageCommunity from "~/components/ManageServer/manage-community";
import ManageRole from "~/components/ManageServer/manage-role";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { SidebarTrigger } from "~/components/ui/sidebar";

export default function ManageServer() {
  const [displayMode, setDisplayMode] = createSignal<"community" | "role" | "invite">("community");

  return (
    <div class="p-2 flex flex-col h-full">
      <Card class="w-full py-3 px-5 mb-2 flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <SidebarTrigger />
          <p>サーバー管理</p>
        </div>
        <hr class="hidden md:flex" />
        <div class="md:flex items-center gap-2 hidden">
          <Button onclick={()=>setDisplayMode("community")} variant={ displayMode()==="community" ? "default" : "outline" }>コミュニティ設定</Button>
          <Button onclick={()=>setDisplayMode("role")} variant={ displayMode()==="role" ? "default" : "outline" }>ロール</Button>
          <Button onclick={()=>setDisplayMode("invite")} variant={ displayMode()==="invite" ? "default" : "outline" }>招待</Button>
        </div>
      </Card>
      
      { displayMode() === "community" && <ManageCommunity /> }
      { displayMode() === "role" && <ManageRole /> }
    </div>
  );
}
