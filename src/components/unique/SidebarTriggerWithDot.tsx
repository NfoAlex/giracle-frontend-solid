import {SidebarTrigger} from "~/components/ui/sidebar";
import {HasAnythingNew} from "~/stores/HasNewMessage";
import {IconCircleFilled} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";

export default function SidebarTriggerWithDot() {
  return (
    <div class={"p-0 m-0 relative"}>
      {/* ↓エラーが出ているが動作確認済み */}
      <Button
        id="sidebarTriggerButton"
        as={SidebarTrigger}
        variant={"ghost"}
        size={"icon"}
      />
      {HasAnythingNew() && <IconCircleFilled size={10} class={"absolute right-0 top-0 z-50"} color={"white"}/>}
    </div>
  );
}