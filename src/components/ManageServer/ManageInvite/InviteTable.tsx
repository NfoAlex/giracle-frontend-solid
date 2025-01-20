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
import { Button } from "~/components/ui/button"
import { Card } from "~/components/ui/card"
 
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
    <div class="flex flex-col gap-2">
      <Card class="px-4 py-2 flex items-center gap-1 sticky top-0 z-50">
        <p>{ Object.keys(rowSelection()).length }件を選択中</p>
        <Button
          variant={"destructive"}
          disabled={Object.keys(rowSelection()).length === 0}
          class="ml-auto"
        >招待を削除</Button>
      </Card>

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
    </div>
  )
}
