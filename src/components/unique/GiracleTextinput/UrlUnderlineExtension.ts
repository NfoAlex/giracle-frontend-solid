import {
  $getRoot,
  $isElementNode,
  $isTextNode,
  defineExtension,
  IS_UNDERLINE,
  type LexicalNode,
  mergeRegister,
  TextNode,
} from "lexical";
import { $isMentionNode } from "./MentionNode.ts";

/**
 * MessageTextRender.tsx の urlPattern と同一
 * (受信側のリンク描画範囲とエディタの下線範囲を一致させるため)。
 * g フラグは共有せず、複数マッチが必要な箇所ではソースから都度 RegExp を作る
 * (共有インスタンスの lastIndex 残留を避けるため)。
 */
const URL_PATTERN_SOURCE =
  "(\\b(https?|ftp|file):\\/\\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])";

type TRange = [start: number, end: number];

/** テキストノードだけのブロックならその子を返す */
function textChildren(node: LexicalNode): TextNode[] | null {
  const parent = node.getParent();
  if (parent === null || !$isElementNode(parent)) return null;
  const children = parent.getChildren();
  return children.every($isTextNode) ? children : null;
}

/** 分割・書式変更してよい素のテキストノード(メンション等は触らない) */
function isPlainTextNode(node: LexicalNode): node is TextNode {
  return (
    $isTextNode(node) && !$isMentionNode(node) && node.getMode() === "normal"
  );
}

/** ブロック全文から URL の範囲を求める(受信側と同じパターン) */
function urlRanges(text: string): TRange[] {
  if (!text.includes("://")) return [];
  const ranges: TRange[] = [];
  for (const match of text.matchAll(new RegExp(URL_PATTERN_SOURCE, "gi"))) {
    ranges.push([match.index, match.index + match[0].length]);
  }
  return ranges;
}

/**
 * ブロックの分割境界と下線書式が URL 範囲と一致しているか(副作用なし)。
 * URL が複数ノードにまたがる入力途中でも判定できるようブロック全文で見る。
 */
function $isUrlUnderlineApplied(node: LexicalNode): boolean {
  const children = textChildren(node);
  if (children === null) return true;
  const ranges = urlRanges(children.map((c) => c.getTextContent()).join(""));
  let offset = 0;
  for (const child of children) {
    const size = child.getTextContentSize();
    const start = offset;
    const end = offset + size;
    offset = end;
    // メンション等は書式を変えないので判定しない
    if (size === 0 || !isPlainTextNode(child)) continue;
    const shouldUnderline = ranges.some(([s, e]) => start >= s && end <= e);
    if (shouldUnderline !== child.hasFormat("underline")) return false;
    // 範囲の端がノード境界からずれていたら分割が必要
    for (const [s, e] of ranges) {
      if ((s > start && s < end) || (e > start && e < end)) return false;
    }
  }
  return true;
}

/** ブロック内の URL 範囲でノードを分割し、下線書式を期待値に揃える */
function $applyUrlUnderline(node: LexicalNode): void {
  const children = textChildren(node);
  if (children === null) return;
  const text = children.map((c) => c.getTextContent()).join("");
  const ranges = urlRanges(text);

  const boundaries = new Set<number>([0, text.length]);
  for (const [start, end] of ranges) {
    boundaries.add(start);
    boundaries.add(end);
  }
  for (const boundary of [...boundaries].sort((a, b) => a - b)) {
    if (boundary === 0 || boundary === text.length) continue;
    // splitText は自ノードを前半に書き換えるため、境界ごとに子を取り直す
    let offset = 0;
    for (const child of textChildren(node) ?? []) {
      const size = child.getTextContentSize();
      if (
        isPlainTextNode(child) &&
        boundary > offset &&
        boundary < offset + size
      ) {
        child.splitText(boundary - offset);
        break;
      }
      offset += size;
    }
  }

  let offset = 0;
  for (const child of textChildren(node) ?? []) {
    const size = child.getTextContentSize();
    const start = offset;
    const end = offset + size;
    offset = end;
    if (size === 0 || !isPlainTextNode(child)) continue;
    const shouldUnderline = ranges.some(([s, e]) => start >= s && end <= e);
    if (shouldUnderline === child.hasFormat("underline")) continue;
    child.setFormat(
      shouldUnderline
        ? child.getFormat() | IS_UNDERLINE
        : child.getFormat() & ~IS_UNDERLINE,
    );
  }
}

/** ルート全体を走査して未適用のブロックだけ直す。変化が無ければ何もしない */
function $underlineUrlsInRoot(): void {
  for (const node of $getRoot().getAllTextNodes()) {
    if ($isUrlUnderlineApplied(node)) continue;
    $applyUrlUnderline(node);
  }
}

export function defineUrlUnderlineExtension() {
  return defineExtension({
    name: "giracle/url-underline",
    // TextNode の underline 書式 → Tailwind クラス(createDOM が自動付与)
    theme: {
      text: { underline: "underline" },
    },
    register(editor) {
      return mergeRegister(
        // 通常入力: 変更されたノードのコミットで走る
        editor.registerNodeTransform(TextNode, $applyUrlUnderline),
        // IME 確定など transform が走らない経路のフォールバック。
        // 適用済みなら何もしない(無限更新しない)。履歴は直前の入力にまとめる
        editor.registerUpdateListener(({ editorState }) => {
          if (editor.isComposing()) return;
          const needsWork = editorState.read(
            () =>
              !$getRoot()
                .getAllTextNodes()
                .every((node) => $isUrlUnderlineApplied(node)),
          );
          if (!needsWork) return;
          editor.update(() => $underlineUrlsInRoot(), { tag: "history-merge" });
        }),
      );
    },
  });
}
