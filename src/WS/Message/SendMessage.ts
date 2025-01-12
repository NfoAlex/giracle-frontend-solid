import type { IMessage } from "~/types/Message";

export default function WSSendMessage(dat: {signal:"...", data: IMessage}) {
  console.log("WSSendMessage :: triggered dat->", dat);
}
