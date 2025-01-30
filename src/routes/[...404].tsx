import { A } from "@solidjs/router";
import {IconFileBroken} from "@tabler/icons-solidjs";
import {Button} from "~/components/ui/button";

export default function NotFound() {
  return (
    <div class={"mx-auto pt-10 text-center flex flex-col items-center gap-3"}>
      <IconFileBroken size={55} />

      <p class="text-2xl font-bold mt-10">
        ここにはなにもありません。
      </p>

      <A href={"/app/channel-browser"}><Button>トップへ戻る</Button></A>
    </div>
  );
}
