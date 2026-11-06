import type { Delta } from "quill";

export interface IQuillInputTriggerItem {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface IQuillInputTrigger {
  /** 1 文字のトリガー（"@" など） */
  trigger: string;
  /** 候補検索。投げた例外はコンポーネント側で握りつぶして空リスト扱い */
  search: (query: string) => Promise<IQuillInputTriggerItem[]>;
  /** Delta→送信用プレーンテキストの表現。既定は `${trigger}<${id}>` */
  toPlainText?: (item: IQuillInputTriggerItem) => string;
}

export interface IQuillInputApi {
  focus(): void;
  /** 内容と履歴を空にする */
  clear(): void;
  /** 送信用プレーンテキスト */
  getText(): string;
  getDelta(): Delta;
}

export interface IQuillInputProps {
  id?: string; // 外側ラッパー div に付与
  class?: string; // 外側ラッパー div に cn() で合成
  placeholder?: string;
  triggers?: IQuillInputTrigger[];
  /** true なら Ctrl/Cmd+Enter のみ送信（Shift+Enter は常に改行） */
  submitWithCtrlKey?: boolean;
  onSubmit?: (text: string) => void;
  onPasteFiles?: (files: File[]) => void;
  ref?: (api: IQuillInputApi) => void;
}
