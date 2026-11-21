import {
  $isElementNode,
  $isLineBreakNode,
  $isTextNode,
  defineExtension,
  IS_UNDERLINE,
  type LexicalNode,
  type LineBreakNode,
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

export function defineUrlUnderlineExtension() {
  return defineExtension({
    name: "giracle/url-underline",
    // TextNode の underline 書式 → Tailwind クラス(createDOM が自動付与)
    theme: {
      text: { underline: "underline" },
    },
    register(editor) {
      // キー入力と同一 update 内で適用するため transform を使う。update listener +
      // 後追い update(history-merge)だと入力と書式適用が別コミットになり、Undo が
      // 種類を問わず1文字単位に断片化する。
      // ParagraphNode の transform は段落自身が dirty にならない限り発火しない
      // (既存テキストへの追記では text ノードだけが dirty)ため、必ず dirty になる
      // TextNode 側に登録する。走査範囲は親ブロックのみでルート全体は見ない。
      // shortcut: 分割・書式適用で dirty ノードが2つ以上になった update は
      // @lexical/history がマージ不可(OTHER)と判定するため、URL を編集している間の
      // Undo は1文字単位のまま。まとめたいなら履歴側の対処が要る
      return editor.registerNodeTransform(TextNode, (node) => {
        // IME 変換中に構成中ノードを splitText すると変換が壊れるためスキップ。
        // 確定時の update でノードが再度 dirty になり、そのときに適用される
        if (editor.isComposing()) return;
        if ($isUrlUnderlineApplied(node)) return;
        $applyUrlUnderline(node);
      });
    },
  });
}
