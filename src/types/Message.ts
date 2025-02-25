export interface IMessage {
  channelId: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  id: string;
  isSystemMessage: false;
  userId: string;
  MessageUrlPreview: IMessageUrlPreview[];
  MessageFileAttached: IMessageFileAttached[];
  reactionSummary: {
    [key: string]: number
  };
}

export interface ICustomEmoji {
  name: string,
  shortcodes: string[],
  url: string,
  category?: string
}

export interface IReaciton {
  id: string,
  userId: string,
  channelId: string,
  messageId: string,
  emojiCode: string
}

export interface IInbox {
  type: "event" | "mention" | "reply";
  userId: string;
  messageId: string;
  Message: IMessage;
  happendAt: string;
}

export interface IMessageUrlPreview {
  description: string;
  faviconLink: string;
  id: number;
  imageLink: string | null;
  title: string;
  type: "article" | "video.other" | "UNKNOWN";
  url: string;
}

export interface IMessageFileAttached {
  id: string;
  userId: string;
  channelId: string;
  messageId: string | null;
  actualFileName: string;
  savedFileName: string;
  size: number;
  type: File["type"];
}

export interface ISystemMessage {
  targetUserId: string,
  messageTerm: "WELCOME" | "CHANNEL_JOIN" | "CHANNEL_LEFT",
}
