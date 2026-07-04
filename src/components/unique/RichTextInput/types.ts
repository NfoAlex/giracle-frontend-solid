import type { IUser } from "~/types/User.ts";

/**
 * RichTextInput の公開Props
 */
export interface RichTextInputProps {
  /** Enter確定時にraw文字列(記法込みプレーンテキスト)を受け取る */
  onEnter?: (raw: string) => void;
  /** 入力変化のたびにraw文字列を受け取る */
  onInput?: (raw: string) => void;
  /** Enter送信の可否判定を親に委ねるフック。省略時はEnter=確定,Shift+Enter=改行 */
  shouldSubmit?: (e: KeyboardEvent) => boolean;
  /** メンション補完のデータソース(検索処理は親から注入する) */
  mentionSearch?: (query: string) => Promise<IUser[]>;
  /** プレースホルダ */
  placeholder?: string;
  /** 命令的APIを親へ渡す */
  ref?: (api: RichTextInputApi) => void;
  /** ペーストイベントの素通し(親がファイル貼り付けを処理するため必須) */
  onPaste?: (e: ClipboardEvent) => void;
}

/**
 * RichTextInput の命令的API
 */
export interface RichTextInputApi {
  clear: () => void;
  focus: () => void;
  getRaw: () => string;
  /** カーソル位置にraw記法テキストを挿入(絵文字ピッカー等からの利用を想定) */
  insertText: (raw: string) => void;
}
