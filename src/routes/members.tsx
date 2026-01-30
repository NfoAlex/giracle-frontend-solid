import type { IUser } from "~/types/User.ts";
import { Table,TableBody,TableCaption,TableCell,TableHead,TableHeader,TableRow } from "~/components/ui/table.tsx";
import { Card } from "~/components/ui/card.tsx";
import SidebarTriggerWithDot from "~/components/unique/SidebarTriggerWithDot.tsx";

export default function Members() {
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
          <TableRow>
            <TableCell class="font-medium">aikon</TableCell>
            <TableCell class="font-medium">Member</TableCell>
            <TableCell>Credit Card</TableCell>
            <TableCell class="text-right">$250.00</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  )
}