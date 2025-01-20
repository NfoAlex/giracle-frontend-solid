import { IconPlus } from "@tabler/icons-solidjs";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "../ui/dialog";
import { createSignal } from "solid-js";
import { TextField, TextFieldInput, TextFieldLabel, TextFieldTextArea } from "../ui/text-field";
import PUT_CHANNEL_CREATE from "~/api/CHANNEL/CHANNEL_CREATE";

export default function CreateChannel() {
  const [channelName, setChannelName] = createSignal<string>("");
  const [description, setDescription] = createSignal<string>("");

  /**
   * チャンネル作成
   */
  const createChannel = () => {
    PUT_CHANNEL_CREATE(channelName(), description())
      .then((r) => {
        console.log("CreateChannel :: createChannel :: r ->", r);
      })
      .catch((err) => {
        console.error("CreateChannel :: createChannel :: err ->", err);
      });
  }

  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>
          チャンネル作成
        </DialogTitle>
        <DialogDescription class="flex flex-col gap-4">
          <TextField class="grid w-full items-center gap-2">
            <TextFieldLabel for="email">チャンネル名</TextFieldLabel>
            <TextFieldInput
              type="text"
              placeholder="チャンネル名"
              value={channelName()}
              onInput={(e)=>setChannelName(e.currentTarget.value)}
            />
          </TextField>
          <TextField class="grid w-full items-center gap-2">
            <TextFieldLabel for="email">概要</TextFieldLabel>
            <TextFieldTextArea
              placeholder="概要"
              value={description()}
              onInput={(e)=>setDescription(e.currentTarget.value)}
            />
          </TextField>
        </DialogDescription>
        <DialogFooter>
          <Button
            onClick={createChannel}
            disabled={channelName() === ""}
            type="submit"
          >作成</Button>
        </DialogFooter>
      </DialogContent>
      <DialogTrigger>
        <Button class="fixed z-50 w-14 h-14 bottom-5 right-5 md:bottom-10 md:right-10">
          <IconPlus />
        </Button>
      </DialogTrigger>
    </Dialog>
  );
}
