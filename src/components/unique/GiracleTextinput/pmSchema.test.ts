/// <reference types="node" />
// DOM が要るため parseDOM は対象外(このテストは Node 単体で動かす)
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Node as PMNode } from "prosemirror-model";
import { EditorState, TextSelection } from "prosemirror-state";
import {
  findUrlRanges,
  getMessageText,
  getTriggerQuery,
  type ITriggerQuery,
  pmSchema,
} from "./pmSchema.ts";

function paragraph(...children: PMNode[]): PMNode {
  return pmSchema.node("paragraph", null, children);
}

function docOf(...blocks: PMNode[]): PMNode {
  return pmSchema.node("doc", null, blocks);
}

/** 段落 1 個のドキュメントを作り、指定位置(段落内オフセット)にキャレットを置く */
function stateAt(text: string, caret = text.length): EditorState {
  const doc = docOf(paragraph(pmSchema.text(text)));
  return EditorState.create({
    doc,
    schema: pmSchema,
    selection: TextSelection.create(doc, 1 + caret),
  });
}

function trigger(text: string): ITriggerQuery | null {
  return getTriggerQuery(stateAt(text));
}

describe("GiracleTextinput pmSchema", () => {
  it("getMessageText: メンションをサーバ保存形式へ変換する", () => {
    const doc = docOf(
      paragraph(
        pmSchema.text("hi "),
        pmSchema.node("mention", { userId: "ab-12", name: "bob" }),
        pmSchema.node("channelMention", { channelId: "ch-1", name: "general" }),
      ),
    );
    assert.equal(getMessageText(doc), "hi @<ab-12>#<ch-1>");
  });

  it("getMessageText: メンション直後の文字に空白を補わない", () => {
    const doc = docOf(
      paragraph(
        pmSchema.node("mention", { userId: "ab-12", name: "bob" }),
        pmSchema.text("です"),
      ),
    );
    assert.equal(getMessageText(doc), "@<ab-12>です");
  });

  });

  it("getMessageText: 素テキストの @< / #< を ZWSP でエスケープする", () => {
    const doc = docOf(paragraph(pmSchema.text("@<x> #<y>")));
    const text = getMessageText(doc);
    assert.ok(text.includes("@\u200B<x>"));
    assert.ok(text.includes("#\u200B<y>"));
    assert.ok(!text.includes("@<x>"));
    assert.ok(!text.includes("#<y>"));
  });

  it("getTriggerQuery: トリガー文字と境界判定", () => {
    assert.equal(trigger("hi @bo")?.kind, "user");
    assert.equal(trigger("hi @bo")?.query, "bo");
    assert.equal(trigger("#gen")?.kind, "channel");
    assert.equal(trigger("#gen")?.query, "gen");
    assert.equal(trigger(":smi")?.kind, "emoji");
    assert.equal(trigger(":smi")?.query, "smi");
    assert.equal(trigger("foo@bar"), null);
    assert.equal(trigger("@<ab-12>"), null);
    assert.equal(trigger("こんにちは@田中")?.kind, "user");
    assert.equal(trigger("こんにちは@田中")?.query, "田中");

    const doc = docOf(paragraph(pmSchema.text("hi @bo")));
    const selected = EditorState.create({
      doc,
      schema: pmSchema,
      selection: TextSelection.create(doc, 2, 4),
    });
    assert.equal(getTriggerQuery(selected), null);
  });

  it("getTriggerQuery: 128 文字窓の外のトリガーは検出しない", () => {
    assert.equal(trigger(`@${"a".repeat(200)}`), null);

    const res = trigger(`${"b".repeat(200)} @x`);
    assert.equal(res?.kind, "user");
    assert.equal(res?.query, "x");

    // 窓の先頭で切れたトリガーは直前文字を確認できないため未検出
    assert.equal(trigger(`${"b".repeat(5)}@${"a".repeat(127)}`), null);
  });

  it("findUrlRanges: URL の範囲を返す", () => {
    const text = "see https://example.com/a ok";
    const url = "https://example.com/a";
    const start = text.indexOf(url);
    assert.deepEqual(findUrlRanges(text), [[start, start + url.length]]);
    assert.deepEqual(findUrlRanges("no url"), []);
  });
});
