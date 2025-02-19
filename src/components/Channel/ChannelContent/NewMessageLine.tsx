import { Badge } from "~/components/ui/badge";

export default function NewMessageLine () {
  return (
    <div class="w-full flex flex-row items-center gap-2" id="NEW_LINE">
      <hr class="grow shrink" />
      <Badge class="shrink-0">新着</Badge>
      <hr class="grow shrink" />
    </div>
  );
}
