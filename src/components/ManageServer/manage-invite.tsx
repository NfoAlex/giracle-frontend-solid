import type { ColumnDef } from "@tanstack/solid-table";
import { createSignal, onMount } from "solid-js";
import GET_SERVER_GET_INVITE from "~/api/SERVER/SERVER_GET_INVITE";
import type { IInvite } from "~/types/Server";
import { InviteTable } from "./ManageInvite/InviteTable";
import { Checkbox } from "../ui/checkbox";
import CreateInvite from "./ManageInvite/CreateInvite";
import { Button } from "../ui/button";
import { IconRefresh } from "@tabler/icons-solidjs";

export default function ManageInvite() {
  const [invites, setInvites] = createSignal<IInvite[]>([]);

  const col: ColumnDef<IInvite>[] = [
    {
      id: "select",
      header: (props) => (
        <Checkbox
          checked={props.table.getIsAllPageRowsSelected()}
          indeterminate={props.table.getIsSomePageRowsSelected()}
          onChange={(value) => props.table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: (props) => (
        <Checkbox
          checked={props.row.getIsSelected()}
          onChange={(value) => props.row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: "inviteCode",
      id: "inviteCode",
      header: "招待コード",
    },
    {
      accessorKey: "expireDate",
      id: "expireDate",
      header: "有効期限",
      cell: (props) => <div class="capitalize">
        { new Date(props.row.getValue("expireDate")).toLocaleString() }
      </div>
    },
    {
      accessorKey: "usedCount",
      id: "usedCount",
      header: "使用回数",
    }
  ];

  const fetchInvites = () => {
    GET_SERVER_GET_INVITE()
      .then((r) => {
        console.log("ManageInvite :: fetchInvites :: r->", r);
        setInvites(r.data);
      })
      .catch((e) => {
        console.error("ManageInvite :: fetchInvites :: e->", e);
      })
  }

  /**
   * 招待に対し操作されたあとにリストを再取得する
   * @param dat 
   */
  const inviteActionTaken = (dat: IInvite) => {
    console.log("ManageInvite :: sig : dat->", dat);

    fetchInvites();
  }

  onMount(fetchInvites);

  return (
    <div class="flex flex-col overflow-y-auto">
      <InviteTable columns={col} data={invites()} inviteActionTaken={inviteActionTaken} />

      <div class={"fixed z-50 bottom-10 right-5 md:right-10 flex flex-col gap-4 md:gap-2"}>
        {/* 再取得ボタン */}
        <Button
          onclick={fetchInvites}
          class="w-14 h-14"
          variant={"secondary"}
        >
          <IconRefresh />
        </Button>
        {/* 招待作成ボタン */}
        <CreateInvite inviteActionTaken={inviteActionTaken} />
      </div>
    </div>
  )
}
