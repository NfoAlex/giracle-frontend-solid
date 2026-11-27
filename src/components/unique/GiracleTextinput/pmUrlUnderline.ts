import type { Node as PMNode } from "prosemirror-model";
import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";
import { findUrlRanges } from "./pmSchema.ts";

const urlUnderlineKey = new PluginKey<DecorationSet>("giracle/url-underline");

/** これを超える文字数の段落は下線を付けない(巨大な textBetween を避ける)。
 * 下線は装飾のみで機能には影響しない */
const MAX_DECORATE_CHARS = 20000;

/** 装飾の総数上限。超えたらそのメッセージの下線は全部諦める(全段落に URL がある
 * 巨大ペーストで毎キー数千個の装飾を作り直すと 100ms/キー級になるため)。
 * 一部だけ下線が付くと見た目が不揃いなので、上限超過時は空の装飾集合を返す */
const MAX_DECORATIONS = 1000;

/**
 * 段落ごとに URL 範囲を求め `underline` クラスを付ける。
 * 受信側 MessageTextRender と同じ URL パターンなので下線範囲とリンク範囲が一致する。
 */
function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];
  let overflow = false;
  doc.descendants((node, pos) => {
    if (overflow) return false;
    if (!node.isTextblock) return true;
    // 文字列化の前にサイズで弾く(巨大な textBetween を避ける)
    if (node.content.size > MAX_DECORATE_CHARS) return false;
    // メンション(atom)は 1 文字の代替文字として扱い、オフセットと doc 座標を 1:1 にする
    const text = node.textBetween(
      0,
      node.content.size,
      undefined,
      () => "\u0000",
    );
    for (const [start, end] of findUrlRanges(text)) {
      if (decorations.length >= MAX_DECORATIONS) {
        overflow = true;
        break;
      }
      decorations.push(
        Decoration.inline(pos + 1 + start, pos + 1 + end, {
          class: "underline",
        }),
      );
    }
    // 段落の子は走査しない
    return false;
  });
  return overflow
    ? DecorationSet.empty
    : DecorationSet.create(doc, decorations);
}

/**
 * URL 下線デコレーション。
 * IME 変換中も transaction は飛ぶが、prosemirror-view が構成中ノードの
 * DOM を保持するため変換は壊れない。
 */
export function urlUnderlinePlugin(): Plugin<DecorationSet> {
  return new Plugin<DecorationSet>({
    key: urlUnderlineKey,
    state: {
      init: (_config, state) => buildDecorations(state.doc),
      apply: (tr, set) => (tr.docChanged ? buildDecorations(tr.doc) : set),
    },
    props: {
      decorations: (state) => urlUnderlineKey.getState(state),
    },
  });
}
