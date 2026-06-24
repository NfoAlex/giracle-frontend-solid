import { createSignal, Show, For, createMemo, createEffect, onCleanup, onMount } from "solid-js";
import { useParams } from "@solidjs/router";
import { Card } from "~/components/ui/card.tsx";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.ts";
import { IUser } from "~/types/User.ts";
import { storeClientConfig } from "~/stores/ClientConfig.ts";

export interface IInputSections {
  type: "text" | "mention" | "channel" | "emoji" | "newline" | "url" | "messageLink";
  value: string;
  lockedUserId?: string;
  isReady?: boolean;
}

export const parseSectionsToText = (sections: IInputSections[]): string => {
  let result = "";
  sections.forEach((sec) => {
    if (sec.type === "text") {
      result += sec.value;
    } else if (sec.type === "mention") {
      result += `@<${sec.lockedUserId}>`;
    } else if (sec.type === "newline") {
      result += "\n";
    }
  });
  return result;
}

export default function RichTextInput(props: {
  value: IInputSections[];
  onInput: (value: IInputSections[]) => void;
  onSubmit: () => void;
  placeholder?: string;
}) {
  const params = useParams();
  const currentChannelId = createMemo(() => params.channelId ?? "");

  let editorRef: HTMLDivElement | undefined;

  const [showSearch, setShowSearch] = createSignal(false);
  const [userList, setUserList] = createSignal<IUser[]>([]);
  const [searchIndex, setSearchIndex] = createSignal(0);
  const [isEmpty, setIsEmpty] = createSignal(true);

  // ===== Parser =====
  const Parser = {
    getSections: (): IInputSections[] => {
      if (!editorRef) return [];

      const sections: IInputSections[] = [];

      const walk = (node: Node) => {
        for (let i = 0; i < node.childNodes.length; i++) {
          const child = node.childNodes[i];

          if (child.nodeType === Node.TEXT_NODE) {
            const val = child.textContent || "";
            if (val) {
              sections.push({ type: "text", value: val });
            }
          } else if (child.nodeType === Node.ELEMENT_NODE) {
            const el = child as HTMLElement;
            if (el.getAttribute("contenteditable") === "false" && el.hasAttribute("data-user-id")) {
              const userId = el.getAttribute("data-user-id") || "";
              const userName = el.textContent?.replace(/^@/, "") || "";
              sections.push({
                type: "mention",
                value: userName,
                lockedUserId: userId,
                isReady: true
              });
            } else if (el.tagName === "BR") {
              sections.push({ type: "newline", value: "\n" });
            } else if (el.tagName === "DIV" || el.tagName === "P") {
              if (sections.length > 0 && sections[sections.length - 1].type !== "newline") {
                sections.push({ type: "newline", value: "\n" });
              }
              walk(el);
            } else {
              walk(el);
            }
          }
        }
      };

      walk(editorRef);
      return sections;
    },
  };

  // ===== Renderer =====
  const Renderer = {
    renderToEditor: (sections: IInputSections[]) => {
      if (!editorRef) return;
      editorRef.textContent = "";
      sections.forEach((sec) => {
        if (sec.type === "text") {
          editorRef.appendChild(document.createTextNode(sec.value));
        } else if (sec.type === "mention") {
          const span = document.createElement("span");
          span.className =
            "inline-block bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium mx-0.5 select-none";
          span.contentEditable = "false";
          span.setAttribute("data-user-id", sec.lockedUserId ?? "");
          span.textContent = `@${sec.value}`;
          editorRef.appendChild(span);
        } else if (sec.type === "newline") {
          editorRef.appendChild(document.createElement("br"));
        }
      });
      setIsEmpty(sections.length === 0);
    },
  };

  // ===== Searcher =====
  const Searcher = {
    users: async (query: string) => {
      try {
        const r = await GET_USER_SEARCH(query, currentChannelId());
        setUserList(r.data || []);
        setSearchIndex(0);
      } catch (e) {
        console.error("searchUser error:", e);
      }
    },
  };

  // ===== Input =====
  const Input = {
    trigger: () => {
      if (editorRef) {
        const parsedJSON = Parser.getSections();
        props.onInput(parsedJSON);
        setIsEmpty(parsedJSON.length === 0);
      }
    },
  };

  // ===== Mention =====
  const Mention = {
    checkTrigger: () => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) {
        setShowSearch(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType !== Node.TEXT_NODE) {
        setShowSearch(false);
        return;
      }

      const text = textNode.textContent || "";
      const caretOffset = range.startOffset;
      const textBeforeCaret = text.slice(0, caretOffset);

      const match = textBeforeCaret.match(/@([^\s]*)$/);

      //ここでトリガー
      if (match) {
        const query = match[1];
        setShowSearch(true);
        if (query.length >= 1) Searcher.users(query);
      } else {
        setShowSearch(false);
      }
    },
    insert: (user: IUser) => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0 || !editorRef) return;

      const range = selection.getRangeAt(0);
      const textNode = range.startContainer;

      if (textNode.nodeType !== Node.TEXT_NODE) return;

      const text = textNode.textContent || "";
      const caretOffset = range.startOffset;
      const textBeforeCaret = text.slice(0, caretOffset);

      const match = textBeforeCaret.match(/@([^\s]*)$/);
      if (!match) return;

      const matchIndex = match.index ?? 0;

      range.setStart(textNode, matchIndex);
      range.setEnd(textNode, caretOffset);
      range.deleteContents();

      const mentionSpan = document.createElement("span");
      mentionSpan.className = "inline-block bg-primary/20 text-primary px-1.5 py-0.5 rounded font-medium mx-0.5 select-none";
      mentionSpan.setAttribute("contenteditable", "false");
      mentionSpan.setAttribute("data-user-id", user.id);
      mentionSpan.textContent = `@${user.name}`;

      const spaceNode = document.createTextNode(" ");

      range.insertNode(spaceNode);
      range.insertNode(mentionSpan);

      const newRange = document.createRange();
      newRange.setStartAfter(spaceNode);
      newRange.collapse(true);
      selection.removeAllRanges();
      selection.addRange(newRange);

      setShowSearch(false);
      Input.trigger();
    },
  };

  // ===== Keyboard =====
  const Keyboard = {
    handleKeyDown: (e: KeyboardEvent) => {
      if (showSearch() && userList().length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSearchIndex((prev) => (prev + 1) % userList().length);
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSearchIndex((prev) => (prev - 1 + userList().length) % userList().length);
          return;
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const selectedUser = userList()[searchIndex()];
          if (selectedUser) {
            Mention.insert(selectedUser);
          }
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setShowSearch(false);
          return;
        }
      }

      if (e.key === "Enter") {
        if (/Mac/.test(navigator.userAgent) && e.isComposing) return;
        if (e.shiftKey) return;
        if (storeClientConfig.chat.sendWithCtrlKey && !e.ctrlKey) return;

        e.preventDefault();
        props.onSubmit();
      }
    },
  };

  createEffect(() => {
    const currentJSON = Parser.getSections();
    if (JSON.stringify(props.value) !== JSON.stringify(currentJSON)) {
      Renderer.renderToEditor(props.value);
    }
  });

  return (
    <div class="relative w-full flex flex-col">
      {/* メンションユーザー検索 */}
      <Show when={showSearch()}>
        <Card class="absolute bottom-full left-0 w-full max-h-48 overflow-y-auto mb-1 p-1 z-50 flex flex-col gap-0.5 bg-popover text-popover-foreground border shadow-md">
          <For each={userList()}>
            {(user, index) => (
              <div
                onClick={() => Mention.insert(user)}
                class={
                  `flex items-center gap-2 p-1.5 rounded cursor-pointer text-sm ${index() === searchIndex() ? "bg-accent text-accent-foreground font-medium" : "hover:bg-muted"}`
                }
              >
                <img
                  src={`/api/user/icon/${user.id}`}
                  alt={user.name}
                  class="w-6 h-6 rounded-full object-cover shrink-0"
                />
                <span class="truncate">{user.name}</span>
              </div>
            )}
          </For>
          {/* ユーザー数が０の時表示 */}
          <Show when={userList().length === 0}>
            <p class="text-muted">...</p>
          </Show>
        </Card>
      </Show>

      <Show when={isEmpty() && props.placeholder}>
        <div class="absolute left-3 top-2.5 pointer-events-none text-muted-foreground text-sm select-none">
          {props.placeholder}
        </div>
      </Show>

      <div
        ref={editorRef}
        contentEditable
        onInput={() => {
          Mention.checkTrigger();
          Input.trigger();
        }}
        onKeyDown={Keyboard.handleKeyDown}
        onKeyUp={Mention.checkTrigger}
        onClick={Mention.checkTrigger}
        class="w-full min-h-[40px] max-h-40 overflow-y-auto p-2 bg-background border rounded-md break-all whitespace-pre-wrap focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}
