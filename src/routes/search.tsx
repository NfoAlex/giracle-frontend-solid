import { Card } from "~/components/ui/card";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";

export default function Search() {
  return (
    <div class="pt-2 px-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>メッセージ検索</p>
      </Card>
      <h1>検索</h1>
    </div>
  );
}