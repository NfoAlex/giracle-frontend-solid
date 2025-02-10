import {Badge} from "~/components/ui/badge";
import {storeMyUserinfo} from "~/stores/MyUserinfo";
import {asyncGetterUserinfo, getterUserinfo} from "~/stores/Userinfo";
import {directGetterChannelInfo} from "~/stores/ChannelInfo";

export default async function FormatMessageContent(content: string) {
  const mentionPattern = /@<([a-f0-9-]+)>/g;
  const channelPattern = /#<([a-f0-9-]+)>/g;
  const newlinePattern = /\n/g;

  //レンダーする要素用データ
  const ObjectIndex: {
    context: string;
    type: "userId" | "breakLine" | "channel";
    index: number;
  }[] = [];

  //メッセージ本文からRegexを使い要素データとテキストデータを分けて順番に追加する関数
  const addMatches = (
    regex: RegExp,
    type: "userId" | "breakLine" | "channel",
  ) => {
    let match = regex.exec(content);
    let lastIndex = 0;

    //Regex結果がある限りオブジェクト格納
    while (match !== null) {
      ObjectIndex.push({
        context: match[0],
        type: type,
        index: match.index,
      });
      lastIndex = regex.lastIndex;
      match = regex.exec(content);
    }
  };

  //ここでメッセージ本文から抜き出し処理
  addMatches(mentionPattern, "userId");
  addMatches(newlinePattern, "breakLine");
  addMatches(channelPattern, "channel");

  ObjectIndex.sort((a, b) => a.index - b.index);

  const contentText: string[] = [];
  let lastIndex = 0;
  for (const obj of ObjectIndex) {
    contentText.push(content.slice(lastIndex, obj.index));
    lastIndex = obj.index + obj.context.length;
  }
  contentText.push(content.slice(lastIndex));

  const result = [];
  for (let i = 0; i < contentText.length; i++) {
    //まず最初のデータをパースする
    result.push(content[i]);
    if (i < ObjectIndex.length) {
      const obj = ObjectIndex[i];
      switch (obj.type) {
        case "userId":
          const user = await asyncGetterUserinfo(obj.context.slice(2, -1));
          result.push(`${user.name}`);
          break;
        case "breakLine":
          result.push("\n");
          break;
        case "channel":
          result.push(`#${directGetterChannelInfo(obj.context.slice(2, -1)).name}`);
          break;
      }
    }
  }

  return result.join("");
}