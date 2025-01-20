import type { ColumnDef } from "@tanstack/solid-table";
import { createSignal, onMount } from "solid-js";
import GET_SERVER_GET_INVITE from "~/api/SERVER/SERVER_GET_INVITE";
import type { IInvite } from "~/types/Server";
import { InviteTable } from "./ManageInvite/InviteTable";
import { Checkbox } from "../ui/checkbox";

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

  onMount(fetchInvites);

  return (
    <div class="flex flex-col">
      <p>招待管理</p>

      <InviteTable columns={col} data={invites()} />
    </div>
  )
}
