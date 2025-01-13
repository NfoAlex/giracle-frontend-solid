import { addMessage, storeHistory } from "~/stores/History";
import type { IMessage } from "~/types/Message";

export default function WSSendMessage(dat: IMessage) {
  console.log("WSSendMessage :: triggered dat->", dat);

  addMessage(dat);
}
