import Quill, { Delta } from "quill";
import "quill/dist/quill.core.css";
import { createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { Card } from "~/components/ui/card.tsx";
import { cn } from "~/lib/utils.ts";
import { MentionBlot, registerQuillInputFormats } from "./QuillInput/blots.ts";
import { applyInlinePatterns } from "./QuillInput/inlinePatterns.ts";
import { deltaToPlainText } from "./QuillInput/serialize.ts";
import type {
  IQuillInputProps,
  IQuillInputTriggerItem,
} from "./QuillInput/types.ts";
import "./QuillInput/quill-input.css";

// モジュールスコープで 1 回だけ登録する（HMR 再評価は overwrite=true で吸収）
registerQuillInputFormats(Quill);

interface IMentionState {
  open: boolean;
  trigger: string;
  query: string;
  index: number; // トリガー文字の絶対 index
  items: IQuillInputTriggerItem[];
  selectIndex: number;
}

const CLOSED: IMentionState = {
  open: false,
  trigger: "",
  query: "",
  index: 0,
  items: [],
  selectIndex: 0,
};
const TRIGGER_CONTEXT_LENGTH = 64;
const SEARCH_DEBOUNCE_MS = 200;

export default function QuillInput(props: IQuillInputProps) {
  let hostEl!: HTMLDivElement;
  let wrapperEl!: HTMLDivElement;
  let quill: Quill | undefined;

  const [mention, setMention] = createSignal<IMentionState>(CLOSED);
  let composing = false;
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let searchSeq = 0;
  let urlRaf = 0; // requestAnimationFrame の ID。行内装飾の適用を次フレームにまとめる
  const renderQueueInput = new Set<number>();

  const triggerOf = (trigger: string) =>
    props.triggers?.find((t) => t.trigger === trigger);

  const getText = () => {
    if (!quill) return "";
    return deltaToPlainText(
      quill.getContents(),
      (value) =>
        triggerOf(value.trigger)?.toPlainText?.(value) ??
        `${value.trigger}<${value.id}>`,
    );
  };

  const selectMention = (item: IQuillInputTriggerItem) => {
    if (!quill) return;
    const m = mention();
    if (!m.open) return;
    const cursor = quill.getSelection()?.index ?? m.index + 1 + m.query.length;
    const length = Math.max(1, cursor - m.index);
    // 先に閉じる（deleteText 由来の selection-change で誤検出しないように）
    setMention(CLOSED);
    quill.deleteText(m.index, length, "user");
    quill.insertEmbed(
      m.index,
      "mention",
      { trigger: m.trigger, ...item },
      "user",
    );
    quill.insertText(m.index + 1, " ", "user");
    quill.setSelection(m.index + 2, 0, "user");
    quill.focus();
  };

  const scheduleSearch = (trigger: string, query: string) => {
    clearTimeout(searchTimer);
    const seq = ++searchSeq;
    searchTimer = setTimeout(async () => {
      try {
        const items = (await triggerOf(trigger)?.search(query)) ?? [];
        const current = mention();
        if (seq !== searchSeq || !current.open) return;
        if (current.trigger !== trigger || current.query !== query) return;
        setMention({ ...current, items, selectIndex: 0 });
      } catch (e) {
        console.error("QuillInput :: search : e->", e);
        if (seq === searchSeq) setMention({ ...mention(), items: [] });
      }
    }, SEARCH_DEBOUNCE_MS);
  };

  /**
   * カーソル直前のトリガー入力（"@name" など）を検出し、候補状態を更新する。
   * 全文は走査せず直前 TRIGGER_CONTEXT_LENGTH 文字だけを見る。
   */
  const detectMention = (index: number) => {
    if (!quill || composing || !props.triggers?.length) {
      setMention(CLOSED);
      return;
    }
    const start = Math.max(0, index - TRIGGER_CONTEXT_LENGTH);
    const before = quill.getText(start, index - start);
    const chars = props.triggers.map((t) => t.trigger).join("");
    const escaped = chars.replace(/[-.*+?^${}()|[\]\\]/g, "\\$&");
    // 前接は「行頭 or 英数字以外」。日本語文中（空白なし）でも検出しつつ、
    // メールアドレス中の @ では開かない
    const match = new RegExp(
      `(?:^|[^A-Za-z0-9_])([${escaped}])([^\\s${escaped}<>]*)$`,
    ).exec(before);
    if (!match) {
      setMention(CLOSED);
      return;
    }

    const trigger = match[1];
    const query = match[2];
    const current = mention();
    // 同一トリガー・同一クエリなら状態を触らない（毎キー再レンダー防止）
    if (
      current.open &&
      current.trigger === trigger &&
      current.query === query
    ) {
      return;
    }
    setMention({
      open: true,
      trigger,
      query,
      index: index - query.length - 1,
      items: [],
      selectIndex: 0,
    });
    if (query.length >= 1) scheduleSearch(trigger, query);
  };

  // キューに積まれた行を次フレームでまとめて処理するだけ（index は受け取らない）
  const scheduleUrlFormat = () => {
    if (urlRaf) return;
    urlRaf = requestAnimationFrame(() => {
      urlRaf = 0;
      if (composing) {
        renderQueueInput.clear();
        return;
      }
      const lines = [...renderQueueInput];
      renderQueueInput.clear();
      if (!quill) return;
      for (const i of lines) applyInlinePatterns(quill, i);
    });
  };

  const onTextChange = (delta: Delta, _oldDelta: Delta, source: string) => {
    if (source !== "user") return;
    // 変更のあった行だけを対象にする
    let index = 0;
    for (const op of delta.ops) {
      if (op.insert !== undefined) {
        if (typeof op.insert === "string") {
          if (op.insert.includes("\n")) {
            let offset = 0;
            for (const part of op.insert.split("\n")) {
              renderQueueInput.add(index + offset);
              offset += part.length + 1;
            }
          } else {
            renderQueueInput.add(index);
          }
          index += op.insert.length;
        } else {
          renderQueueInput.add(index);
          index += 1;
        }
      } else if (op.delete !== undefined) {
        renderQueueInput.add(index);
      } else if (typeof op.retain === "number") {
        index += op.retain;
      }
    }
    scheduleUrlFormat();
    // Quill はタイピング時の selection-change を silent で出すため、入力時は text-change から検出する
    if (!composing) detectMention(quill?.getSelection()?.index ?? index);
  };

  const onSelectionChange = (
    range: { index: number; length: number } | null,
  ) => {
    if (!quill) return;
    if (!range || range.length > 0) {
      setMention(CLOSED);
      return;
    }
    detectMention(range.index);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // IME 変換確定の Enter を送信・候補確定に使わない
    if (e.isComposing) return;

    const m = mention();
    if (m.open) {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (m.items.length > 0) {
            setMention({
              ...m,
              selectIndex: Math.min(m.selectIndex + 1, m.items.length - 1),
            });
          }
          return;
        case "ArrowUp":
          e.preventDefault();
          if (m.items.length > 0) {
            setMention({ ...m, selectIndex: Math.max(m.selectIndex - 1, 0) });
          }
          return;
        case "Enter":
        case "Tab": {
          e.preventDefault();
          const item = m.items[m.selectIndex];
          if (item) selectMention(item);
          else setMention(CLOSED);
          return;
        }
        case "Escape":
          e.preventDefault();
          setMention(CLOSED);
          return;
        default:
          return;
      }
    }

    if (e.key !== "Enter" || e.shiftKey) return;
    if (props.submitWithCtrlKey && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    props.onSubmit?.(getText());
  };

  const onPaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) files.push(file);
    }
    if (files.length > 0) props.onPasteFiles?.(files);
  };

  onMount(() => {
    quill = new Quill(hostEl, {
      modules: { toolbar: false },
      placeholder: props.placeholder ?? "",
    });
    // 外側の div は focus できないため、id は編集領域（contenteditable）に付ける
    if (props.id) quill.root.id = props.id;

    quill.on("text-change", onTextChange);
    quill.on("selection-change", onSelectionChange);

    quill.root.addEventListener("compositionstart", () => {
      composing = true;
    });
    quill.root.addEventListener("compositionend", () => {
      composing = false;
      const index = quill?.getSelection()?.index ?? 0;
      // 変換中はキューを捨てているので、確定位置の行を改めて積む
      renderQueueInput.add(index);
      scheduleUrlFormat();
      detectMention(index);
    });

    // Quill の keyboard module より先に消費するため capture で拾う
    wrapperEl.addEventListener("keydown", onKeyDown, true);
    wrapperEl.addEventListener("paste", onPaste);

    // エディタ内コピペでチップをプレーンテキストに崩さない
    quill.clipboard.addMatcher(".quill-input-mention", (node) => {
      return new Delta().insert({
        mention: MentionBlot.value(node as HTMLElement),
      });
    });

    props.ref?.({
      focus: () => quill?.focus(),
      clear: () => {
        quill?.setText("", "api");
        quill?.history.clear();
        setMention(CLOSED);
      },
      getText,
      getDelta: () => quill?.getContents() ?? new Delta(),
    });
  });

  onCleanup(() => {
    clearTimeout(searchTimer);
    cancelAnimationFrame(urlRaf);
    wrapperEl.removeEventListener("keydown", onKeyDown, true);
    wrapperEl.removeEventListener("paste", onPaste);
    quill?.off("text-change", onTextChange);
    quill?.off("selection-change", onSelectionChange);
  });

  return (
    <div ref={wrapperEl} class={cn("relative flex flex-col", props.class)}>
      {/* Quill が自前で DOM を管理するため、ここには何も置かない */}
      <div ref={hostEl} />
      <Show when={mention().open}>
        <Card class="absolute left-0 bottom-full mb-1 z-10 w-full max-h-40 overflow-y-auto p-2 border-b-0 cursor-pointer">
          <Show when={mention().items.length === 0}>
            <p class="text-center">...</p>
          </Show>
          <For each={mention().items}>
            {(item, index) => (
              <button
                type="button"
                // mousedown でフォーカスが外れると Quill が selection-change(null) を出し候補が閉じる
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectMention(item)}
                class={cn(
                  "flex w-full items-center gap-2 rounded p-2 text-left hover:bg-border",
                  mention().selectIndex === index() && "bg-border",
                )}
              >
                <Show when={item.avatarUrl}>
                  <img
                    alt=""
                    src={item.avatarUrl}
                    class="w-8 h-8 rounded-full"
                  />
                </Show>
                <p class="grow">{item.name}</p>
              </button>
            )}
          </For>
        </Card>
      </Show>
    </div>
  );
}
