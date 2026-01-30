import type { IUser } from "~/types/User.ts";
import { Table,TableBody,TableCaption,TableCell,TableHead,TableHeader,TableRow } from "~/components/ui/table.tsx";
import { Card } from "~/components/ui/card.tsx";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";
import { Avatar,AvatarFallback,AvatarImage } from "~/components/ui/avatar.tsx";
import { createSignal,For } from "solid-js";

export default function Members() {
  const [users, setUsers] = createSignal<IUser[]>([]);

  return (
    <div class="h-full p-2 flex flex-col gap-2">
      <Card class="w-full py-3 px-5 flex items-center gap-2">
        <SidebarTriggerWithDot />
        <p>ユーザー</p>
      </Card>
      <Table class="grow">
        <TableCaption>このコミュニティに所属するユーザーの一覧です。</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead class="w-[100px]">アイコン</TableHead>
            <TableHead>ユーザー名</TableHead>
            <TableHead class="w-[100px]">BAN状態</TableHead>
            <TableHead>ロール一覧</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <For each={users()}>
            {(user) => (
              <TableRow>
                <TableCell class="font-medium">
                  <Avatar class="mx-auto w-9 h-9">
                    <AvatarImage src={`/api/user/icon/${"asdf"}`} />
                    <AvatarFallback class="w-full h-full">{"asdf"}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell class="font-medium">{user.name}</TableCell>
                <TableCell>{ user.isBanned.toString() }</TableCell>
                <TableCell class="text-right">
                  { user.RoleLink.join(", ") }
                </TableCell>
              </TableRow>
            )}
          </For>
        </TableBody>
      </Table>
    </div>
  )
}