import { IconMoodSmileFilled, IconMoodWrrrFilled, IconRocket } from "@tabler/icons-solidjs"
import { For, Match, Show, Switch, createMemo, createSignal, onCleanup, type JSX } from "solid-js"
import { Badge } from "~/components/ui/badge.tsx"
import { Button } from "~/components/ui/button.tsx"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover.tsx"
import { useIsMobile } from "~/components/ui/sidebar.tsx"
import { cn } from "~/lib/utils.ts"
import {
  DIFFICULTY_CONFIG,
  createMinesweeperController,
  type CellViewModel,
  type Difficulty,
  type GameStatus
} from "./useMinesweeperController.ts"

const LONG_PRESS_MS = 350
const LONG_PRESS_MOVE_THRESHOLD = 8
const CELL_SIZE_PX = 24
const CELL_GAP_PX = 2
const CONTENT_HORIZONTAL_PADDING_PX = 24
const POPUP_MAX_WIDTH = "92vw"

const numberColorMap: Record<number, string> = {
  1: "text-blue-600 dark:text-blue-300",
  2: "text-green-600 dark:text-green-300",
  3: "text-red-600 dark:text-red-300",
  4: "text-indigo-600 dark:text-indigo-300",
  5: "text-orange-600 dark:text-orange-300",
  6: "text-cyan-600 dark:text-cyan-300",
  7: "text-violet-700 dark:text-violet-300",
  8: "text-stone-700 dark:text-stone-300"
}

const statusTextColor = (status: GameStatus): string => {
  if (status === "won") return "text-green-700 dark:text-green-300"
  if (status === "lost") return "text-red-700 dark:text-red-300"
  return "text-muted-foreground"
}

const StatusIcon = (props: { status: GameStatus }) => {
  return (
    <Switch>
      <Match when={props.status === "playing"}>
        <IconMoodSmileFilled size={18} />
      </Match>
      <Match when={props.status === "lost"}>
        <IconMoodWrrrFilled size={18} />
      </Match>
      <Match when={props.status === "won"}>
        <IconRocket size={18} />
      </Match>
    </Switch>
  )
}

type MinesweeperPopupProps = {
  trigger?: JSX.Element
  triggerClass?: string
}

type CellButtonProps = {
  cell: CellViewModel
  status: GameStatus
  isMobile: boolean
  onOpen: () => void
  onToggleFlag: () => void
}

const CellButton = (props: CellButtonProps) => {
  let longPressTimer: number | null = null
  let longPressTriggered = false
  let startX = 0
  let startY = 0

  const clearLongPressTimer = () => {
    if (longPressTimer !== null) {
      window.clearTimeout(longPressTimer)
      longPressTimer = null
    }
  }

  const startLongPress = (event: PointerEvent) => {
    if (
      !props.isMobile ||
      event.pointerType !== "touch" ||
      props.status !== "playing" ||
      props.cell.revealed ||
      props.cell.unavailable
    ) {
      return
    }

    longPressTriggered = false
    startX = event.clientX
    startY = event.clientY
    clearLongPressTimer()
    longPressTimer = window.setTimeout(() => {
      longPressTriggered = true
      props.onToggleFlag()
    }, LONG_PRESS_MS)
  }

  const cancelLongPressByMove = (event: PointerEvent) => {
    if (longPressTimer === null) return
    const movedX = Math.abs(event.clientX - startX)
    const movedY = Math.abs(event.clientY - startY)
    if (movedX > LONG_PRESS_MOVE_THRESHOLD || movedY > LONG_PRESS_MOVE_THRESHOLD) {
      clearLongPressTimer()
    }
  }

  const handleClick: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    if (props.cell.unavailable) return

    if (longPressTriggered) {
      longPressTriggered = false
      event.preventDefault()
      event.stopPropagation()
      return
    }
    props.onOpen()
  }

  const handleContextMenu: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = (event) => {
    event.preventDefault()
    if (props.cell.unavailable || props.isMobile) return
    props.onToggleFlag()
  }

  const cellLabel = createMemo(() => {
    if (props.cell.unavailable) return ""
    if (!props.cell.revealed && props.cell.flagged) return "F"
    if (props.cell.revealed && props.cell.exploded) return "X"
    if (props.cell.revealed && props.cell.isMine) return "M"
    if (!props.cell.revealed && props.status === "lost" && props.cell.isMine) return "M"
    if (props.cell.revealed && props.cell.adjacentMines > 0) return `${props.cell.adjacentMines}`
    return ""
  })

  const cellClass = createMemo(() => {
    if (props.cell.unavailable) return "pointer-events-none opacity-0"
    if (props.cell.revealed) {
      if (props.cell.exploded) return "border-red-500 bg-red-100 dark:bg-red-900/50"
      if (props.cell.isMine) return "border-orange-500 bg-orange-100 dark:bg-orange-900/50"
      return "border-border/70 bg-muted/70"
    }
    return "border-border bg-background hover:bg-accent/70 active:bg-accent"
  })

  const labelClass = createMemo(() => {
    if (!props.cell.revealed && props.cell.flagged) return "text-amber-600 dark:text-amber-300"
    if ((props.cell.revealed || props.status === "lost") && props.cell.isMine) {
      return "text-red-700 dark:text-red-300"
    }
    if (props.cell.revealed && props.cell.adjacentMines > 0) {
      return numberColorMap[props.cell.adjacentMines] ?? "text-foreground"
    }
    return "text-foreground"
  })

  return (
    <button
      type="button"
      class={cn(
        "flex size-6 select-none items-center justify-center rounded-[2px] border text-[11px] font-semibold leading-none",
        cellClass()
      )}
      onPointerDown={(event) => startLongPress(event)}
      onPointerMove={(event) => cancelLongPressByMove(event)}
      onPointerUp={clearLongPressTimer}
      onPointerLeave={clearLongPressTimer}
      onPointerCancel={clearLongPressTimer}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      aria-label={`cell-${props.cell.row}-${props.cell.col}`}
    >
      <span class={labelClass()}>{cellLabel()}</span>
    </button>
  )
}

export default function MinesweeperPopup(props: MinesweeperPopupProps) {
  const [isOpen, setIsOpen] = createSignal(false)
  const isMobile = useIsMobile()
  const controller = createMinesweeperController("easy")
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 })
  const [isDraggingPopup, setIsDraggingPopup] = createSignal(false)

  let activeDragPointerId: number | null = null
  let dragStartX = 0
  let dragStartY = 0
  let dragBaseX = 0
  let dragBaseY = 0
  let dragMinDeltaX = 0
  let dragMaxDeltaX = 0
  let dragMinDeltaY = 0
  let dragMaxDeltaY = 0

  const gameState = createMemo(() => controller.gameState())
  const canRestart = createMemo(() => gameState().status === "won" || gameState().status === "lost")
  const nextDifficulty = createMemo<Difficulty>(() =>
    controller.difficulty() === "easy" ? "kyoyo" : "easy"
  )
  const boardWidthPx = createMemo(() => {
    const cols = gameState().cols
    return cols * CELL_SIZE_PX + (cols - 1) * CELL_GAP_PX
  })
  const popupWidth = createMemo(() => `min(${POPUP_MAX_WIDTH}, ${boardWidthPx() + CONTENT_HORIZONTAL_PADDING_PX}px)`)

  const stopPopupDrag = () => {
    if (!isDraggingPopup()) return
    setIsDraggingPopup(false)
    activeDragPointerId = null
    window.removeEventListener("pointermove", onPopupDragMove)
    window.removeEventListener("pointerup", stopPopupDrag)
    window.removeEventListener("pointercancel", stopPopupDrag)
  }

  const clamp = (value: number, min: number, max: number): number => {
    if (value < min) return min
    if (value > max) return max
    return value
  }

  const onPopupDragMove = (event: PointerEvent) => {
    if (!isDraggingPopup()) return
    if (activeDragPointerId !== null && event.pointerId !== activeDragPointerId) return

    const rawDeltaX = event.clientX - dragStartX
    const rawDeltaY = event.clientY - dragStartY
    const clampedDeltaX = clamp(rawDeltaX, dragMinDeltaX, dragMaxDeltaX)
    const clampedDeltaY = clamp(rawDeltaY, dragMinDeltaY, dragMaxDeltaY)

    setDragOffset({
      x: dragBaseX + clampedDeltaX,
      y: dragBaseY + clampedDeltaY
    })
  }

  const startPopupDrag: JSX.EventHandlerUnion<HTMLDivElement, PointerEvent> = (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") return

    const targetEl = event.target as HTMLElement | null
    const interactiveParent = targetEl?.closest(
      "button, a, input, textarea, select, [role='button'], [contenteditable='true'], [data-no-drag]"
    )
    if (interactiveParent) return

    activeDragPointerId = event.pointerId
    dragStartX = event.clientX
    dragStartY = event.clientY
    dragBaseX = dragOffset().x
    dragBaseY = dragOffset().y

    const rect = event.currentTarget.getBoundingClientRect()
    const minDeltaX = -rect.left
    const maxDeltaX = window.innerWidth - rect.right
    const minDeltaY = -rect.top
    const maxDeltaY = window.innerHeight - rect.bottom

    dragMinDeltaX = Math.min(minDeltaX, maxDeltaX)
    dragMaxDeltaX = Math.max(minDeltaX, maxDeltaX)
    dragMinDeltaY = Math.min(minDeltaY, maxDeltaY)
    dragMaxDeltaY = Math.max(minDeltaY, maxDeltaY)

    event.preventDefault()
    setIsDraggingPopup(true)
    window.addEventListener("pointermove", onPopupDragMove)
    window.addEventListener("pointerup", stopPopupDrag)
    window.addEventListener("pointercancel", stopPopupDrag)
  }

  onCleanup(() => {
    stopPopupDrag()
  })

  return (
    <Popover open={isOpen()} onOpenChange={setIsOpen}>
      <PopoverTrigger
        class={
          props.triggerClass ??
          "w-fit appearance-none border-0 bg-transparent p-0 text-left text-xl font-normal text-sidebar-foreground hover:bg-transparent"
        }
      >
        {props.trigger ?? "Giracle"}
      </PopoverTrigger>

      <PopoverContent
        class="border-sidebar-border bg-sidebar p-3 text-sidebar-foreground"
        style={{
          width: popupWidth(),
          "max-width": POPUP_MAX_WIDTH,
          translate: `${dragOffset().x}px ${dragOffset().y}px`
        }}
        onPointerDown={startPopupDrag}
      >
        <div
          class={cn(
            "grid grid-cols-[1fr_auto_1fr] items-center gap-2",
            isDraggingPopup() ? "cursor-grabbing" : "cursor-auto"
          )}
        >
          <div class="justify-self-start">
            <Button
              type="button"
              size="sm"
              variant="outline"
              class="h-7 px-3 text-xs"
              onClick={() => controller.changeDifficulty(nextDifficulty())}
              title="クリックで難易度を切り替え"
              aria-label="難易度切り替え"
            >
              {DIFFICULTY_CONFIG[controller.difficulty()].label}
            </Button>
          </div>

          <button
            type="button"
            class={cn(
              "inline-flex items-center rounded-md border p-1.5 justify-self-center",
              canRestart() ? "cursor-pointer hover:bg-accent/70" : "cursor-default",
              statusTextColor(gameState().status)
            )}
            onClick={() => controller.restartGame()}
            disabled={!canRestart()}
            title={canRestart() ? "クリックで再スタート" : "プレイ中は再スタートできません"}
            aria-label={`game-status-${gameState().status}`}
          >
            <StatusIcon status={gameState().status} />
          </button>

          <Badge variant="secondary" class="justify-self-end">
            残り: {gameState().remainingMines}
          </Badge>
        </div>

        <Show when={isMobile()}>
          <div class="mt-2">
            <Badge variant="outline">長押しでフラグ</Badge>
          </div>
        </Show>

        <Show
          when={!controller.errorMessage()}
          fallback={
            <div class="mt-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <p>ゲームの初期化に失敗しました。</p>
              <Show when={controller.errorMessage()}>
                <p class="mt-1 text-xs text-muted-foreground">{controller.errorMessage()}</p>
              </Show>
              <Button type="button" size="sm" class="mt-3" onClick={() => controller.retryInitialize()}>
                再試行
              </Button>
            </div>
          }
        >
          <div
            class="mt-3 max-h-[min(60vh,36rem)] overflow-auto rounded-md border border-sidebar-border bg-background/80 p-2"
            data-no-drag
          >
            <div
              class="inline-grid gap-[2px]"
              style={{
                "grid-template-columns": `repeat(${gameState().cols}, minmax(0, ${CELL_SIZE_PX}px))`
              }}
            >
              <For each={gameState().cells}>
                {(row) => (
                  <For each={row}>
                    {(cell) => (
                      <CellButton
                        cell={cell}
                        status={gameState().status}
                        isMobile={isMobile()}
                        onOpen={() => controller.openCell(cell.row, cell.col)}
                        onToggleFlag={() => controller.toggleFlag(cell.row, cell.col)}
                      />
                    )}
                  </For>
                )}
              </For>
            </div>
          </div>
        </Show>
      </PopoverContent>
    </Popover>
  )
}
