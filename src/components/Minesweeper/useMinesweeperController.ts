import { MinesweeperEngine, type CellData, type GameSnapshot } from "@maxxam0n/minesweeper-engine"
import { createSignal, type Accessor } from "solid-js"

export type Difficulty = "easy" | "kyoyo"
export type GameStatus = "playing" | "won" | "lost"

type DifficultyConfig = {
  label: string
  rows: number
  cols: number
  mines: number
}

export type CellViewModel = {
  row: number
  col: number
  revealed: boolean
  flagged: boolean
  adjacentMines: number
  isMine: boolean
  exploded: boolean
  unavailable: boolean
}

export type MinesweeperViewState = {
  status: GameStatus
  rows: number
  cols: number
  mines: number
  remainingMines: number
  cells: CellViewModel[][]
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: {
    label: "Easy",
    rows: 9,
    cols: 9,
    mines: 10
  },
  kyoyo: {
    label: "教養",
    rows: 30,
    cols: 30,
    mines: 150
  }
}

const EMPTY_CELL: Omit<CellViewModel, "row" | "col"> = {
  revealed: false,
  flagged: false,
  adjacentMines: 0,
  isMine: false,
  exploded: false,
  unavailable: false
}

const toViewStatus = (status: GameSnapshot["status"]): GameStatus => {
  if (status === "won") return "won"
  if (status === "lost") return "lost"
  return "playing"
}

const createInitialCells = (rows: number, cols: number): CellViewModel[][] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      row,
      col,
      ...EMPTY_CELL
    }))
  )

const createInitialState = (difficulty: Difficulty): MinesweeperViewState => {
  const config = DIFFICULTY_CONFIG[difficulty]
  return {
    status: "playing",
    rows: config.rows,
    cols: config.cols,
    mines: config.mines,
    remainingMines: config.mines,
    cells: createInitialCells(config.rows, config.cols)
  }
}

const toCellViewModel = (cell: CellData | null, row: number, col: number): CellViewModel => {
  if (!cell) {
    return {
      row,
      col,
      ...EMPTY_CELL,
      unavailable: true
    }
  }

  return {
    row,
    col,
    revealed: cell.isRevealed,
    flagged: cell.isFlagged,
    adjacentMines: cell.adjacentMines,
    isMine: cell.isMine,
    exploded: cell.isExploded,
    unavailable: false
  }
}

type MinesweeperController = {
  difficulty: Accessor<Difficulty>
  gameState: Accessor<MinesweeperViewState>
  errorMessage: Accessor<string | null>
  changeDifficulty: (nextDifficulty: Difficulty) => void
  openCell: (row: number, col: number) => void
  toggleFlag: (row: number, col: number) => void
  restartGame: () => void
  retryInitialize: () => void
}

export const createMinesweeperController = (
  initialDifficulty: Difficulty = "easy"
): MinesweeperController => {
  const [difficulty, setDifficulty] = createSignal<Difficulty>(initialDifficulty)
  const [engine, setEngine] = createSignal<MinesweeperEngine | null>(null)
  const [gameState, setGameState] = createSignal<MinesweeperViewState>(createInitialState(initialDifficulty))
  const [errorMessage, setErrorMessage] = createSignal<string | null>(null)

  const syncFromSnapshot = (snapshot: GameSnapshot, currentDifficulty: Difficulty) => {
    const config = DIFFICULTY_CONFIG[currentDifficulty]
    setGameState({
      status: toViewStatus(snapshot.status),
      rows: config.rows,
      cols: config.cols,
      mines: config.mines,
      remainingMines: config.mines - snapshot.flaggedCells.length,
      cells: snapshot.field.map((rowCells, row) =>
        rowCells.map((cell, col) => toCellViewModel(cell, row, col))
      )
    })
  }

  const initialize = (currentDifficulty: Difficulty) => {
    try {
      setErrorMessage(null)
      const config = DIFFICULTY_CONFIG[currentDifficulty]
      const nextEngine = new MinesweeperEngine({
        type: "square",
        params: {
          rows: config.rows,
          cols: config.cols,
          mines: config.mines
        }
      })
      setEngine(nextEngine)
      syncFromSnapshot(nextEngine.gameSnapshot, currentDifficulty)
    } catch (error) {
      setEngine(null)
      setGameState(createInitialState(currentDifficulty))
      const fallbackMessage = "ゲームの初期化に失敗しました。"
      if (error instanceof Error && error.message) {
        setErrorMessage(`${fallbackMessage} ${error.message}`)
        return
      }
      setErrorMessage(fallbackMessage)
    }
  }

  const runAction = (action: (currentEngine: MinesweeperEngine) => void) => {
    const currentEngine = engine()
    if (!currentEngine) return
    try {
      action(currentEngine)
      syncFromSnapshot(currentEngine.gameSnapshot, difficulty())
    } catch (error) {
      const fallbackMessage = "ゲーム操作中にエラーが発生しました。"
      if (error instanceof Error && error.message) {
        setErrorMessage(`${fallbackMessage} ${error.message}`)
        return
      }
      setErrorMessage(fallbackMessage)
    }
  }

  const changeDifficulty = (nextDifficulty: Difficulty) => {
    if (nextDifficulty === difficulty()) return
    setDifficulty(nextDifficulty)
    initialize(nextDifficulty)
  }

  const openCell = (row: number, col: number) => {
    if (gameState().status !== "playing") return
    runAction((currentEngine) => {
      const result = currentEngine.revealCell({ row, col })
      result.apply()
    })
  }

  const toggleFlag = (row: number, col: number) => {
    if (gameState().status !== "playing") return
    runAction((currentEngine) => {
      const result = currentEngine.toggleFlag({ row, col })
      result.apply()
    })
  }

  const restartGame = () => {
    const status = gameState().status
    if (status === "playing") return
    initialize(difficulty())
  }

  const retryInitialize = () => {
    initialize(difficulty())
  }

  initialize(initialDifficulty)

  return {
    difficulty,
    gameState,
    errorMessage,
    changeDifficulty,
    openCell,
    toggleFlag,
    restartGame,
    retryInitialize
  }
}
