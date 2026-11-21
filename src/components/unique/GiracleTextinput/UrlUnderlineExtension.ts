import {
  $getRoot,
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  defineExtension,
  IS_UNDERLINE,
  type LexicalNode,
  type LineBreakNode,
  type TextNode,
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

/** 改行(LineBreak)を透過させてブロックの子を返す(分割・書式の対象にはしない) */
function textChildren(node: LexicalNode): (TextNode | LineBreakNode)[] | null {
  const parent = node.getParent();
  if (parent === null || !$isElementNode(parent)) return null;
  const children = parent.getChildren();
  // MentionNode は TextNode の一種なので含まれる。LineBreak は改行(\n)として
  // オフセット計算にだけ使い、分割・書式変更は isPlainTextNode で除外する
  return children.every((c) => $isTextNode(c) || $isLineBreakNode(c))
    ? (children as (TextNode | LineBreakNode)[])
    : null;
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

/** 各ブロックから代表ノードを1つ取り出す(ブロック単位で処理するため) */
function $blockSampleNodes(): LexicalNode[] {
  const samples: LexicalNode[] = [];
  for (const block of $getRoot().getChildren()) {
    if (!$isElementNode(block)) continue;
    const first = block
      .getChildren()
      .find((c) => $isTextNode(c) || $isLineBreakNode(c));
    if (first !== undefined) samples.push(first);
  }
  return samples;
}

/** ルート全体を走査して未適用のブロックだけ直す。変化が無ければ何もしない */
function $underlineUrlsInRoot(): void {
  for (const node of $blockSampleNodes()) {
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
      // update listener 一本化。dirty ノード単位の transform は大量ペースト時に
      // ブロック全体の再走査を dirty 数だけ繰り返す(transform ストーム)ため使わない。
      // ブロック単位の判定・適用で 1コミットあたり O(文書長) に収める。
      // 適用済みなら何もしない(無限更新しない)。履歴は直前の入力にまとめる
      return editor.registerUpdateListener(({ editorState }) => {
        if (editor.isComposing()) return;
        const needsWork = editorState.read(() =>
          $blockSampleNodes().some((node) => !$isUrlUnderlineApplied(node)),
        );
        if (!needsWork) return;
        editor.update(() => $underlineUrlsInRoot(), { tag: "history-merge" });
      });
    },
  });
}
