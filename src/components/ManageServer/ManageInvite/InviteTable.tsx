import { createEffect, createSignal, For, Show } from "solid-js"
import { type ColumnDef, createSolidTable, flexRender, getCoreRowModel } from "@tanstack/solid-table"
 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "~/components/ui/table"
 
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}
 
export function InviteTable<TData, TValue>(props: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = createSignal({})
  
  const table = createSolidTable({
    get data() {
      return props.data
    },
    get columns() {
      return props.columns
    },
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      get rowSelection() {
        return rowSelection()
      }
    },
  });

  createEffect(() => {
    console.log("rowSelection", rowSelection());
  });
 
  return (
    <div class="rounded-md border h-full">
      <Table>
        <TableHeader>
          <For each={table.getHeaderGroups()}>
            {(headerGroup) => (
              <TableRow>
                <For each={headerGroup.headers}>
                  {(header) => (
                      <TableHead colSpan={header.colSpan}>
                        <Show when={!header.isPlaceholder}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Show>
                      </TableHead>
                    )}
                </For>
              </TableRow>
            )}
          </For>
        </TableHeader>
        <TableBody>
            <Show
              when={table.getRowModel().rows?.length}
              fallback={
                <TableRow>
                  <TableCell colSpan={props.columns.length} class="h-24 text-center">
                    結果が見つかりませんでした。
                  </TableCell>
                </TableRow>
              }
            >
              <For each={table.getRowModel().rows}>
                {(row) => (
                  <TableRow data-state={row.getIsSelected() && "selected"}>
                    <For each={row.getVisibleCells()}>
                      {(cell) => (
                        <TableCell>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )}
                    </For>
                  </TableRow>
                )}
              </For>
            </Show>
          </TableBody>
      </Table>
    </div>
  )
}
