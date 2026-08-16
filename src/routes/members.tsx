import { Card } from "~/components/ui/card";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot";

export default function Members() {
  return (
    <div class={"p-2 flex flex-col gap-2"}>
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>メンバー一覧</p>
      </Card>

      <div>
        asdf
      </div>
    </div>
  );
}
