import type { IChannel } from "../../src/types/Channel.ts";
import type {
  ICustomEmoji,
  IInbox,
  IMessage,
  IMessageFileAttached,
  IMessageUrlPreview,
  IReaciton,
} from "../../src/types/Message.ts";
import type { IRole } from "../../src/types/Role.ts";
import type { IUser } from "../../src/types/User.ts";
import type { IMockSeed } from "./store.ts";

const U = {
  alice: "00000000-0000-4000-8000-000000000001",
  bob: "00000000-0000-4000-8000-000000000002",
  carol: "00000000-0000-4000-8000-000000000003",
  dave: "00000000-0000-4000-8000-000000000004",
  eve: "00000000-0000-4000-8000-000000000005",
  frank: "00000000-0000-4000-8000-000000000006",
};

const C = {
  general: "10000000-0000-4000-8000-000000000001",
  random: "10000000-0000-4000-8000-000000000002",
  dev: "10000000-0000-4000-8000-000000000003",
  announce: "10000000-0000-4000-8000-000000000004",
  event: "10000000-0000-4000-8000-000000000005",
};

const msgId = (ch: number, n: number) =>
  `${(0x20000000 + ch).toString(16)}-0000-4000-8000-${n
    .toString(16)
    .padStart(12, "0")}`;

let fileSeq = 0;
const fileId = () =>
  `${(0x30000000 + fileSeq++).toString(16)}-0000-4000-8000-000000000000`;

const LONG_TEXT = [
  "本日の開発進捗について共有します。",
  "フロントエンドは SolidJS と Vite、バックエンドは Elysia で構築しています。",
  "モック環境を用意したことで、サーバを起動せずに画面の挙動を確認できるようになりました。",
  "これによりデザイン確認やテストがスムーズになり、レビューの待ち時間も減っています。",
  "画像やファイル添付、リアクション、メンションなどの表示も一通り確認できます。",
  "引き続き細かい UI 調整とアクセシビリティの改善を進めていきます。",
  "気になる点があればこのチャンネルで気軽にコメントしてください。",
  "長文メッセージの折り返しや改行の表示についても、実際のデータで確認できるようにしました。",
  "それでは良い一日をお過ごしください。",
  "何かあればいつでもメンションしてください。",
  "Thank you for your continued support and feedback.",
].join("");

const POOL = [
  "今日はいい天気ですね。散歩でもどうですか？",
  "That sounds good. Let's meet at 10:00.",
  "了解です！あとで詳細を共有します。",
  "この機能、もう少し改善できそうですね。",
  "I'll check the logs and get back to you.",
  "週末の予定はまだ空いています。",
  "ありがとうございます、助かりました。",
  "Let's keep this channel focused on announcements.",
  "新しいデザイン案を確認しました。とても見やすいです。",
  "レビューありがとう。指摘はすべて対応済みです。",
];

const preview = (
  id: number,
  url: string,
  title: string,
  description: string,
  type: IMessageUrlPreview["type"] = "article",
): IMessageUrlPreview => ({
  description,
  faviconLink: "https://example.com/favicon.ico",
  id,
  imageLink: null,
  videoLink: null,
  title,
  type,
  url,
});

interface MessageSpec {
  at: number;
  userId?: string;
  content: string;
  edited?: boolean;
  system?: boolean;
  replyTo?: number;
  mentions?: string[];
  replyInboxFor?: string;
  previews?: IMessageUrlPreview[];
  file?: { name: string; type: string; size: number };
}

interface Built {
  messages: IMessage[];
  files: IMessageFileAttached[];
  inbox: IInbox[];
}

const buildChannel = (
  chIdx: number,
  channelId: string,
  count: number,
  specs: MessageSpec[],
  authors: string[],
  baseTime: number,
): Built => {
  const built: Built = { messages: [], files: [], inbox: [] };
  for (let i = 0; i < count; i++) {
    const spec = specs.find((s) => s.at === i);
    const userId = spec?.userId ?? authors[i % authors.length];
    const content = spec?.content ?? POOL[i % POOL.length];
    const createdAt = new Date(baseTime + i * 7 * 60_000).toISOString();
    const replyTo = spec?.replyTo;
    const replyingMessageId =
      replyTo === undefined ? null : built.messages[replyTo].id;
    const message = {
      channelId,
      content,
      isEdited: spec?.edited === true,
      createdAt,
      id: msgId(chIdx, i),
      isSystemMessage: spec?.system === true,
      userId,
      replyingMessageId,
      MessageUrlPreview: spec?.previews ?? [],
      MessageFileAttached: [] as IMessageFileAttached[],
      reactionSummary: [],
    } as unknown as IMessage;

    if (spec?.file) {
      const fid = fileId();
      const dot = spec.file.name.lastIndexOf(".");
      const file: IMessageFileAttached = {
        id: fid,
        userId,
        channelId,
        messageId: message.id,
        actualFileName: spec.file.name,
        savedFileName: fid + spec.file.name.slice(dot),
        size: spec.file.size,
        type: spec.file.type,
      };
      message.MessageFileAttached.push(file);
      built.files.push(file);
    }

    built.messages.push(message);

    for (const target of spec?.mentions ?? []) {
      built.inbox.push({
        type: "mention",
        userId: target,
        messageId: message.id,
        Message: { ...message, reactionSummary: [] },
        happendAt: createdAt,
      });
    }
    if (spec?.replyInboxFor) {
      built.inbox.push({
        type: "reply",
        userId: spec.replyInboxFor,
        messageId: message.id,
        Message: { ...message, reactionSummary: [] },
        happendAt: createdAt,
      });
    }
  }
  return built;
};

const systemContent = (
  targetUserId: string,
  messageTerm:
    | "WELCOME"
    | "CHANNEL_JOIN"
    | "CHANNEL_LEFT"
    | "CHANNEL_INVITED"
    | "CHANNEL_KICKED",
) => JSON.stringify({ targetUserId, messageTerm });

export function createSeed(): IMockSeed {
  const hostCreatedAt = new Date("2024-01-01T00:00:00.000Z");

  const ROLE_HOST: IRole = {
    name: "HOST",
    id: "HOST",
    createdAt: hostCreatedAt,
    createdUserId: U.alice,
    color: "#ff5722",
    manageServer: true,
    manageChannel: true,
    manageRole: true,
    manageUser: true,
    manageEmoji: true,
  };
  const ROLE_MEMBER: IRole = {
    name: "MEMBER",
    id: "MEMBER",
    createdAt: hostCreatedAt,
    createdUserId: U.alice,
    color: "#607d8b",
    manageServer: false,
    manageChannel: false,
    manageRole: false,
    manageUser: false,
    manageEmoji: false,
  };
  const ROLE_BOT: IRole = {
    name: "BOT",
    id: "BOT",
    createdAt: hostCreatedAt,
    createdUserId: U.alice,
    color: "#9e9e9e",
    manageServer: false,
    manageChannel: false,
    manageRole: false,
    manageUser: false,
    manageEmoji: false,
  };

  const users: IUser[] = [
    {
      id: U.alice,
      name: "alice",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "Giracle の管理人です。フロントエンドとデザインを担当しています。よろしくお願いします。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "HOST" }],
    },
    {
      id: U.bob,
      name: "bob",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "バックエンドを書いています。Elysia と TypeScript が好きです。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "MEMBER" }],
    },
    {
      id: U.carol,
      name: "carol",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "テストとドキュメントを担当しています。小さな改善をコツコツ進めます。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "MEMBER" }],
    },
    {
      id: U.dave,
      name: "dave",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "インフラと CI の面倒を見ています。たまに料理の話もします。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "MEMBER" }],
    },
    {
      id: U.eve,
      name: "eve",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "デザインとアクセシビリティに関心があります。気軽に話しかけてください。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "MEMBER" }],
    },
    {
      id: U.frank,
      name: "frank",
      isBanned: false,
      isBot: false,
      selfIntroduction:
        "最近参加しました。まずは雰囲気に慣れたいと思っています。",
      ChannelJoin: [],
      RoleLink: [{ roleId: "MEMBER" }],
    },
  ];

  const channels: IChannel[] = [
    {
      name: "一般",
      id: C.general,
      description: "サーバー全体の雑談と連絡用チャンネルです。",
      createdUserId: U.alice,
      isArchived: false,
      ChannelViewableRole: [],
    },
    {
      name: "雑談",
      id: C.random,
      description: "気軽に雑談するチャンネルです。",
      createdUserId: U.alice,
      isArchived: false,
      ChannelViewableRole: [],
    },
    {
      name: "開発談義",
      id: C.dev,
      description: "実装や設計について議論するチャンネルです。",
      createdUserId: U.alice,
      isArchived: false,
      ChannelViewableRole: [],
    },
    {
      name: "アナウンス",
      id: C.announce,
      description: "重要なお知らせを投稿するチャンネルです。",
      createdUserId: U.alice,
      isArchived: false,
      ChannelViewableRole: [{ roleId: "MEMBER" }, { roleId: "HOST" }],
    },
    {
      name: "イベント",
      id: C.event,
      description: "イベント運営の関係者だけが閲覧できるチャンネルです。",
      createdUserId: U.alice,
      isArchived: false,
      ChannelViewableRole: [{ roleId: "HOST" }],
    },
  ];

  const joins = [
    { userId: U.alice, channelId: C.general },
    { userId: U.alice, channelId: C.random },
    { userId: U.alice, channelId: C.dev },
    { userId: U.alice, channelId: C.announce },
    { userId: U.alice, channelId: C.event },
    { userId: U.bob, channelId: C.general },
    { userId: U.bob, channelId: C.random },
    { userId: U.bob, channelId: C.dev },
    { userId: U.bob, channelId: C.announce },
    { userId: U.carol, channelId: C.general },
    { userId: U.carol, channelId: C.random },
    { userId: U.carol, channelId: C.dev },
    { userId: U.dave, channelId: C.general },
    { userId: U.dave, channelId: C.announce },
    { userId: U.eve, channelId: C.general },
    { userId: U.eve, channelId: C.random },
    { userId: U.frank, channelId: C.general },
  ];

  const dayBase = (chIdx: number) => Date.UTC(2025, 8, 1 + chIdx, 9, 0, 0);

  const general = buildChannel(
    1,
    C.general,
    45,
    [
      {
        at: 0,
        userId: U.alice,
        system: true,
        content: systemContent(U.carol, "CHANNEL_JOIN"),
      },
      {
        at: 1,
        userId: U.alice,
        system: true,
        content: systemContent(U.dave, "WELCOME"),
      },
      {
        at: 2,
        userId: U.alice,
        content: "みなさん、こんにちは！Giracle のモック環境へようこそ。",
      },
      {
        at: 3,
        userId: U.bob,
        content:
          "お知らせです。\n今夜 21:00 から軽く打ち合わせをします。\n参加できる人はリアクションをお願いします。",
      },
      {
        at: 4,
        userId: U.carol,
        content: "New design looks great! 特にサイドバーの余白がいい感じです。",
        previews: [
          preview(
            1,
            "https://example.com/design-notes",
            "デザインノート",
            "サイドバーとメッセージ一覧の余白についてのメモ。",
          ),
        ],
      },
      {
        at: 5,
        userId: U.alice,
        content: LONG_TEXT,
      },
      {
        at: 6,
        userId: U.bob,
        content: `@<${U.alice}> この件、確認してもらえますか？`,
        mentions: [U.alice],
      },
      {
        at: 7,
        userId: U.carol,
        content: `@<${U.alice}> デザインの修正版を共有しました。`,
        mentions: [U.alice],
        previews: [
          preview(
            2,
            "https://example.com/mock-preview",
            "Mock Preview",
            "バックエンドなしで動作するプレビュー環境の紹介。",
            "UNKNOWN",
          ),
        ],
      },
      {
        at: 8,
        userId: U.dave,
        content: `@<${U.bob}> サーバーのログを確認しました。問題なさそうです。`,
        mentions: [U.bob],
      },
      {
        at: 9,
        userId: U.alice,
        content: "スクリーンショットを添付します。",
        file: { name: "screenshot.png", type: "image/png", size: 184320 },
      },
      {
        at: 10,
        userId: U.eve,
        content: "仕様書の PDF も置いておきます。",
        file: {
          name: "specification.pdf",
          type: "application/pdf",
          size: 524288,
        },
      },
      {
        at: 11,
        userId: U.frank,
        content: "参加させていただきました。よろしくお願いします！",
        edited: true,
      },
      {
        at: 12,
        userId: U.bob,
        content: "アリスさんの案に賛成です。実装もシンプルで良さそうです。",
        replyTo: 2,
        replyInboxFor: U.alice,
      },
      {
        at: 13,
        userId: U.alice,
        content: "参考リンクをまとめました。あとで読んでみてください。",
        previews: [
          preview(
            3,
            "https://example.com/reading-list",
            "読み物リスト",
            "設計とアクセシビリティに関する記事のまとめ。",
          ),
        ],
      },
    ],
    [U.alice, U.bob, U.carol, U.dave, U.eve, U.frank],
    dayBase(1),
  );

  const random = buildChannel(
    2,
    C.random,
    34,
    [
      { at: 0, userId: U.carol, content: "今日のお昼は何にしましたか？" },
      {
        at: 1,
        userId: U.eve,
        content: "I had ramen today. とてもおいしかったです。",
      },
      {
        at: 2,
        userId: U.alice,
        content:
          "週末に映画を見に行く予定です。\nおすすめがあれば教えてください。",
      },
      { at: 3, userId: U.bob, content: LONG_TEXT },
      {
        at: 4,
        userId: U.dave,
        content: "最近ジョギングを始めました。",
        edited: true,
      },
      {
        at: 5,
        userId: U.bob,
        content: "散歩の写真を貼っておきます。",
        file: { name: "walk.jpg", type: "image/png", size: 262144 },
      },
      {
        at: 6,
        userId: U.carol,
        content: "いいですね！どのあたりを歩いたんですか？",
        replyTo: 0,
      },
      {
        at: 7,
        userId: U.eve,
        content: "この記事、面白かったです。",
        previews: [
          preview(
            4,
            "https://example.com/weekend",
            "週末の過ごし方",
            "有意義な週末を過ごすための小さなヒント。",
          ),
        ],
      },
      {
        at: 10,
        userId: U.alice,
        system: true,
        content: systemContent(U.eve, "CHANNEL_INVITED"),
      },
    ],
    [U.carol, U.eve, U.alice, U.bob, U.dave],
    dayBase(2),
  );

  const dev = buildChannel(
    3,
    C.dev,
    33,
    [
      { at: 0, userId: U.bob, content: "型定義の整理を進めています。" },
      {
        at: 1,
        userId: U.alice,
        content: "TypeScript の設定を見直しました。strict は維持したいです。",
      },
      {
        at: 2,
        userId: U.carol,
        content:
          "テストが通らない箇所があります。\n再現手順は以下のとおりです。\n1. サーバーを起動\n2. ログイン\n3. 履歴を開く",
      },
      { at: 3, userId: U.dave, content: LONG_TEXT },
      {
        at: 4,
        userId: U.bob,
        content: `@<${U.alice}> このリファクタリング、方針を確認したいです。`,
        mentions: [U.alice],
      },
      {
        at: 5,
        userId: U.carol,
        content: "方針はドキュメントにまとめました。",
        replyTo: 4,
      },
      {
        at: 6,
        userId: U.alice,
        content: "設計資料の PDF です。",
        file: {
          name: "architecture.pdf",
          type: "application/pdf",
          size: 786432,
        },
      },
      {
        at: 7,
        userId: U.eve,
        content: "アクセシビリティの観点も追記しておきました。",
        edited: true,
      },
      {
        at: 8,
        userId: U.bob,
        content: "関連する issue はこちらです。",
        previews: [
          preview(
            5,
            "https://example.com/issues/42",
            "Issue #42",
            "履歴のページングに関する議論。",
          ),
        ],
      },
    ],
    [U.bob, U.alice, U.carol, U.dave, U.eve],
    dayBase(3),
  );

  const announce = buildChannel(
    4,
    C.announce,
    32,
    [
      {
        at: 0,
        userId: U.alice,
        content: "サーバーのメンテナンスは今週土曜日の深夜に行います。",
      },
      {
        at: 1,
        userId: U.bob,
        content: "Maintenance window is 02:00-04:00 JST. ご了承ください。",
      },
      {
        at: 2,
        userId: U.alice,
        content:
          "リリースノート\n・履歴表示の改善\n・WS の再接続処理\n・軽微な不具合修正",
      },
      { at: 3, userId: U.alice, content: LONG_TEXT },
      {
        at: 4,
        userId: U.dave,
        content: "メンテナンス完了しました。",
        edited: true,
      },
      {
        at: 5,
        userId: U.alice,
        content: "完了報告のスクリーンショットです。",
        file: { name: "status.png", type: "image/png", size: 98304 },
      },
      {
        at: 6,
        userId: U.dave,
        content: "通知の設定を確認しておきます。",
        replyTo: 0,
      },
      {
        at: 7,
        userId: U.bob,
        content: "運用ガイドはこちらです。",
        previews: [
          preview(
            6,
            "https://example.com/runbook",
            "運用ガイド",
            "障害対応とメンテナンスの手順書。",
          ),
        ],
      },
    ],
    [U.alice, U.bob, U.dave],
    dayBase(4),
  );

  const event = buildChannel(
    5,
    C.event,
    30,
    [
      {
        at: 0,
        userId: U.alice,
        content: "次のイベントの会場候補をまとめました。",
      },
      {
        at: 1,
        userId: U.alice,
        content:
          "Event schedule draft is ready. 参加者数の見積もりを確認します。",
      },
      {
        at: 2,
        userId: U.alice,
        content:
          "当日のタイムテーブル\n10:00 開場\n10:30 挨拶\n11:00 セッション",
      },
      { at: 3, userId: U.alice, content: LONG_TEXT },
      {
        at: 4,
        userId: U.alice,
        content: "会場の見取り図です。",
        edited: true,
      },
      {
        at: 5,
        userId: U.alice,
        content: "会場の写真を添付します。",
        file: { name: "venue.png", type: "image/png", size: 327680 },
      },
      {
        at: 6,
        userId: U.alice,
        content: "備品リストの確認をお願いします。",
        replyTo: 0,
      },
      {
        at: 7,
        userId: U.alice,
        content: "参考にしたイベントページです。",
        previews: [
          preview(
            7,
            "https://example.com/event",
            "イベントページ",
            "過去に開催したイベントの記録。",
            "UNKNOWN",
          ),
        ],
      },
    ],
    [U.alice],
    dayBase(5),
  );

  const built = [general, random, dev, announce, event];

  const reaction = (
    i: number,
    chIdx: number,
    msgIdx: number,
    userId: string,
    emojiCode: string,
  ): IReaciton => ({
    id: `${(0x40000000 + i).toString(16)}-0000-4000-8000-000000000000`,
    userId,
    channelId: channels[chIdx].id,
    messageId: built[chIdx].messages[msgIdx].id,
    emojiCode,
  });

  const reactions: IReaciton[] = [
    reaction(1, 0, 2, U.alice, "👍"),
    reaction(2, 0, 2, U.bob, "👍"),
    reaction(3, 0, 2, U.carol, "👍"),
    reaction(4, 0, 3, U.bob, "🎉"),
    reaction(5, 0, 4, U.carol, "giracle"),
    reaction(6, 0, 6, U.bob, "giracle"),
    reaction(7, 1, 1, U.alice, "🎉"),
    reaction(8, 1, 1, U.dave, "🎉"),
    reaction(9, 2, 4, U.bob, "mock"),
    reaction(10, 2, 0, U.carol, "👍"),
    reaction(11, 3, 0, U.alice, "🎉"),
    reaction(12, 4, 1, U.alice, "mock"),
  ];

  const last = (b: Built) => b.messages[b.messages.length - 1].createdAt;

  const readTimes = [
    {
      userId: U.alice,
      channelId: C.general,
      readTime: general.messages[general.messages.length - 40].createdAt,
    },
    { userId: U.alice, channelId: C.random, readTime: last(random) },
    { userId: U.alice, channelId: C.dev, readTime: last(dev) },
    { userId: U.alice, channelId: C.announce, readTime: last(announce) },
    { userId: U.alice, channelId: C.event, readTime: last(event) },
    {
      userId: U.bob,
      channelId: C.general,
      readTime: general.messages[20].createdAt,
    },
    { userId: U.bob, channelId: C.random, readTime: last(random) },
    {
      userId: U.carol,
      channelId: C.general,
      readTime: general.messages[10].createdAt,
    },
    { userId: U.carol, channelId: C.dev, readTime: last(dev) },
  ];

  const inbox: IInbox[] = built.flatMap((b) => b.inbox);

  const customEmojis: ICustomEmoji[] = [
    {
      id: "50000001-0000-4000-8000-000000000001",
      code: "giracle",
      uploadedUserId: U.alice,
    },
    {
      id: "50000002-0000-4000-8000-000000000002",
      code: "mock",
      uploadedUserId: U.bob,
    },
  ];

  const files: Record<string, IMessageFileAttached> = {};
  for (const b of built) {
    for (const file of b.files) files[file.id] = file;
  }

  const messages: IMessage[] = built.flatMap((b) => b.messages);

  return {
    users,
    passwords: {
      [U.alice]: "pass",
      [U.bob]: "pass",
      [U.carol]: "pass",
      [U.dave]: "pass",
      [U.eve]: "pass",
      [U.frank]: "pass",
    },
    roles: [ROLE_HOST, ROLE_MEMBER, ROLE_BOT],
    channels,
    messages,
    reactions,
    joins,
    readTimes,
    inbox,
    customEmojis,
    files,
    config: {
      isFirstUser: false,
      name: "Giracle Mock",
      introduction: "バックエンドなしで動くモックプレビュー環境です。",
      RegisterAvailable: true,
      RegisterInviteOnly: false,
      RegisterAnnounceChannelId: C.announce,
      MessageMaxLength: 2000,
      MessageMaxFileSize: 10485760,
      defaultJoinChannel: [channels[0]],
      BotEnabled: false,
    },
  };
}
