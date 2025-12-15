import { createMemo, For, type JSX } from "solid-js";
// Dynamic は不要になったので削除
// onMount も不要になったので削除
import { directGetterChannelInfo } from "~/stores/ChannelInfo.ts";
import { getterUserinfo } from "~/stores/Userinfo.ts";
import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper.tsx";

export default function MessageTextRender(props: { content: string }) {
  // props.content や依存するストアの値が変わった時だけ再計算されるメモを作成
  const parsedContent = createMemo<JSX.Element[]>(() => {
    // console.log("Running linkify logic for content:", props.content); // デバッグ用

    const urlPattern =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const mentionPattern = /@<([a-f0-9-]+)>/g;
    const channelPattern = /#<([a-f0-9-]+)>/g;
    const inlineCodePattern = /`([^`]+)`/g;
    // newlinePattern やその他のパターンは textContent の whitespace-pre-wrap で処理するため不要かも

    type MatchType = "link" | "userId" | "channel" | "inlineCode";
    interface MatchObject {
      context: string;
      type: MatchType;
      index: number;
      idOrValue: string; // パース後の値 (URL, ID, コード内容)
    }

    const objectIndex: MatchObject[] = [];

    // マッチを追加するヘルパー関数 (ID抽出も追加)
    const addMatches = (regex: RegExp, type: MatchType, idExtractor?: (match: RegExpExecArray) => string) => {
      let match;
      // lastIndexをリセットして最初から検索
      regex.lastIndex = 0;
      while ((match = regex.exec(props.content)) !== null) {
        let idOrValue: string;
        switch (type) {
          case "link":
            idOrValue = match[0]; // リンクはそのまま
            break;
          case "userId":
          case "channel":
            idOrValue = match[1]; // キャプチャグループ1 (ID)
            break;
          case "inlineCode":
            idOrValue = match[1]; // キャプチャグループ1 (コード内容)
            break;
          default:
            idOrValue = match[0]; // フォールバック
        }
        objectIndex.push({
          context: match[0], // マッチした元の文字列
          type: type,
          index: match.index,
          idOrValue: idOrValue,
        });
      }
    };

    // パターンを検索
    addMatches(urlPattern, "link");
    addMatches(mentionPattern, "userId");
    addMatches(channelPattern, "channel");
    addMatches(inlineCodePattern, "inlineCode");

    // インデックスでソート
    objectIndex.sort((a, b) => a.index - b.index);

    const messageRenderingFinal: JSX.Element[] = [];
    let lastIndex = 0;

    // テキストとマッチ部分を交互に処理
    for (const obj of objectIndex) {
      // マッチまでのテキスト部分を追加
      if (obj.index > lastIndex) {
        const textSegment = props.content.slice(lastIndex, obj.index);
        // textSegment を改行文字 (\n) で分割し、それぞれを span でラップするか、
        // 単一の span に white-space: pre-wrap を適用する
        messageRenderingFinal.push(
          <span class="whitespace-pre-wrap break-words">{textSegment}</span>
        );
      }

      // マッチ部分をタイプに応じてJSXに変換
      switch (obj.type) {
        case "link":
          messageRenderingFinal.push(
            <a href={obj.idOrValue} target="_blank" rel="noopener noreferrer" class="underline whitespace-pre-wrap break-words">
              {obj.idOrValue}
            </a>
          );
          break;
        case "userId":
          // createMemo 内でリアクティブな値を参照すると、その値の変更時にメモが再計算される
          const userInfo = getterUserinfo(obj.idOrValue);
          const isMe = () => storeMyUserinfo.id === obj.idOrValue; // storeMyUserinfo.id もリアクティブに追跡
          messageRenderingFinal.push(
            <UserinfoModalWrapper userId={userInfo.id} class="cursor-pointer">
              <span class={`${isMe() ? "bg-primary text-primary-foreground" : "bg-border"} hover:underline my-auto mx-px align-baseline inline-flex rounded px-1`}>
                @{userInfo?.name ?? obj.idOrValue}
              </span>
            </UserinfoModalWrapper>
          );
          break;
        case "channel":
          // directGetterChannelInfo もリアクティブなソースであれば追跡される
          const channelInfo = directGetterChannelInfo(obj.idOrValue);
          messageRenderingFinal.push(
            <span class="font-medium cursor-pointer hover:underline mx-px">
              #{channelInfo?.name ?? obj.idOrValue} {/* fallback */}
            </span>
          );
          break;
        case "inlineCode":
          messageRenderingFinal.push(
            <code class="bg-gray-200 dark:bg-gray-700 rounded px-1 py-0.5 text-sm font-mono mx-px">
              {obj.idOrValue}
            </code>
          );
          break;
      }
      lastIndex = obj.index + obj.context.length;
    }

    // 最後のマッチ以降の残りのテキストを追加
    if (lastIndex < props.content.length) {
      const remainingText = props.content.slice(lastIndex);
      messageRenderingFinal.push(
        <span class="whitespace-pre-wrap break-words">{remainingText}</span>
      );
    }

    // 空のコンテンツの場合のフォールバック
    if (messageRenderingFinal.length === 0 && props.content === "") {
        return []; // or [<span />] など、必要に応じて
    }

    // 計算結果（JSX要素の配列）を返す
    return messageRenderingFinal;
  }); // 依存配列は SolidJS が自動で検出

  // biome-ignore lint/correctness/useJsxKeyInIterable: SolidのForは通常Keyなしで効率的
  return (
    <div class="py-1 w-full"> {/* items-baselineを追加するとBadgeなどの縦位置が揃いやすい */}
      <For each={parsedContent()}>{(el) => el}</For>
    </div>
  );
}