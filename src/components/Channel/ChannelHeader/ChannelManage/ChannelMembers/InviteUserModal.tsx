import { IconCheck, IconPlus, IconSearch } from "@tabler/icons-solidjs";
import { createSignal, For, Show } from "solid-js";
import { createMutable } from "solid-js/store";
import POST_CHANNEL_INVITE from "~/api/CHANNEL/CHANNEL_INVITE";
import GET_USER_SEARCH from "~/api/USER/USER_SEARCH.";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTrigger } from "~/components/ui/dialog";
import { TextField, TextFieldInput } from "~/components/ui/text-field";
import UserinfoModalWrapper from "~/components/unique/UserinfoModalWrapper";
import { getterUserinfo } from "~/stores/Userinfo";
import { IUser } from "~/types/User";

export default function InviteUserModal(props: { channelId: string }) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const [userList, setUserList] = createSignal<IUser[]>([]);
  const [cursor, setCursor] = createSignal<number>(0);
  const [status, setStatus] = createSignal<"waiting"|"success"|"fail">("waiting");
  
  //招待時の結果、状態管理
  const inviteJson = createMutable({
    processing: false,
    invitingUserId: ""
  });

  /**
   * ユーザーの検索をする
   * @param optionInsert 結果に追加挿入する形で検索するかどうか（cursorを進めて検索）
   */
  const searchIt = (optionInsert = false) => {
    GET_USER_SEARCH(searchQuery(), "", cursor())
      .then((r) => {
        setStatus("success");
        if (optionInsert) {
          setUserList((u) => [...u, ...r.data]);
        } else {
          setUserList(r.data);
        }
      })
      .catch((e) => {
        console.error("InviteUserModal :: searchIt : エラー -> ", e);
        setStatus("fail");
      });
  };

  /**
   * ユーザーをチャンネルへ招待する
   * @param userId 
   */
  const inviteIt = (userId: string) => {
    //招待中のユーザーIDと処理中状態をセット
    inviteJson.invitingUserId = userId;
    inviteJson.processing = true;

    POST_CHANNEL_INVITE(userId, props.channelId)
      .then((r) => {
        console.log("InviteUserModal :: inviteIt : 招待成功 -> ", r);
      })
      .catch((e) => {
        console.error("InviteUserModal :: inviteIt : 招待失敗 -> ", e);
        alert("招待に失敗しました。\n" + e);
      })
      .finally(() => {
        //招待中のユーザーIDと処理中状態をリセット
        inviteJson.invitingUserId = "";
        inviteJson.processing = false;
      });
  };

  return (
    <Dialog>
      <DialogTrigger>
        <Button class="w-full">ユーザーを招待する</Button>
      </DialogTrigger>

      <DialogContent>

        <DialogHeader>
          <p>ユーザーを招待</p>
        </DialogHeader>

        <div class="w-full flex items-center gap-2">
          <TextField class="w-full">
            <TextFieldInput
              value={searchQuery()}
              onInput={(e)=>setSearchQuery(e.currentTarget.value)}
              placeholder="招待するユーザー名を検索"
            />
          </TextField>

          <Button onclick={()=>searchIt(false)} size="icon"><IconSearch /></Button>
        </div>

        <hr class={"my-2"} />

        <Show when={status() === "waiting"}>
          <p class="text-center">ユーザー名を入力してください。</p>
        </Show>
        {
          (userList().length === 0 && status() === "success")
          &&
          <p class="text-center">ユーザーが見つかりません。</p>
        }

        <For each={userList()}>
          {
            (user) => (
              <div class="p-2 w-full flex flex-row items-center gap-2 rounded cursor-pointer">
                <Avatar class="w-8 h-8">
                  <AvatarFallback >{ user.id.slice(0,2) }</AvatarFallback>
                  <AvatarImage src={"/api/user/icon/" + user.id} alt={user.id} />
                </Avatar>
                <UserinfoModalWrapper userId={user.id}>
                  <p class="hover:underline">{ getterUserinfo(user.id).name }</p>
                </UserinfoModalWrapper>

                {
                  (user.ChannelJoin.some((c) => c.channelId === props.channelId) || inviteJson.invitingUserId === user.id)
                  ?
                    <IconCheck class="ml-auto" />
                  :
                    <Button onclick={()=>inviteIt(user.id)} class="ml-auto" size="icon" disabled={inviteJson.processing}><IconPlus /></Button>
                }
              </div>
            )
          }
        </For>
      </DialogContent>
    </Dialog>
  );
}