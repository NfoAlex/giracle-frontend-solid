import { Card } from "../ui/card.tsx";
import { IconPencil, IconReload, IconTrash } from "@tabler/icons-solidjs";
import { createSignal, For, onMount, Show } from "solid-js";
import GET_USER_SESSION from "~/api/USER/USER_GET_SESSION.ts";
import { Button } from "../ui/button.tsx";
import DELETE_USER_SESSION from "~/api/USER/USER_DELETE_SESSION.ts";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog.tsx";
import { Badge } from "../ui/badge.tsx";
import POST_USER_CHANGE_SESSION_NAME from "~/api/USER/USER_POST_CHANGE_SESSION_NAME.ts";
import { TextField, TextFieldInput } from "../ui/text-field.tsx";

interface ISession {
  id: number;
  name: string;
  userId: string;
  createdAt: Date;
  thisIsYou: boolean;
};

export default function ConfigSession() {
  const [sessions, setSessions] = createSignal<ISession[]>([]);
  const [flags, setFlags] = createSignal({
    fetching: false,
    deleting: false,
    changingName: false,
    fetchedBottom: false
  });
  const [reachedSessionEnd, setReachedSessionEnd] = createSignal(false);
  const [newSessionName, setNewSessionName] = createSignal("");
  let targetDeletingSession: ISession | undefined = undefined;
  let targetNameChangingSession: ISession | undefined = undefined;
  //モーダル制御用
  const [modalDeletionOpen, setModalDeletionOpen] = createSignal(false);
  const [modalNameChangingOpen, setModalNameChangingOpen] = createSignal(false);

  const sessionFetcher = async (cursor: number = 1) => {
    setFlags({...flags(), fetching: true});
    await GET_USER_SESSION()
      .then((r) => {
        const DEBUG_SAMPLES: ISession[] = [];
        for (let i=0; i<30; i++) {
          DEBUG_SAMPLES.push({
            id: 90 + i,
            name: "debug_" + i,
            createdAt: new Date(),
            thisIsYou: false,
            userId: "SAMPLE"
          });
        }
        //DEBUG
        //setSessions(r.data);
        setSessions([...r.data, ...DEBUG_SAMPLES]);

        //セッションデータが３０個未満なら末端まで取得したと設定
        if (r.data.length < 30) {
          setReachedSessionEnd(false);
        }
      })
      .catch((err) => {
        console.error("ConfigSession :: err->", err, { cursor });
      })
      .finally(() => {
        setFlags({...flags(), fetching: false});
      });
  };

  const removeSession = async (sessionId: number) => {
    setFlags({...flags(), deleting: true});
    await DELETE_USER_SESSION(sessionId)
      .then((r) => {
        const deletedSessionId = r.data.sessionId;
        const _sessions = sessions().filter((s) => s.id !== deletedSessionId);
        setSessions(_sessions);
      })
      .catch(() => {
        console.error("ConfigSession :: removeSession : セッションを削除できませんでした", sessionId);
      })
      .finally(() => {
        setFlags({...flags(), deleting: false});
        setModalDeletionOpen(false);
      });
  };

  const changeSessionName = async () => {
    const targetSession = targetNameChangingSession;
    if (targetSession === undefined) throw new Error("Target session data is undefined");
    setFlags({...flags(), changingName: true});

    await POST_USER_CHANGE_SESSION_NAME(targetSession.id, newSessionName())
      .then((r) => {
        const sessionIndex = sessions().findIndex((s) => s.id === targetSession.id);
        setSessions((s) => {
          const _sessions = [...s];
          _sessions[sessionIndex] = { ..._sessions[sessionIndex], name: r.data.name };
          return _sessions;
        });
      })
      .catch((e) => console.error("ConfigSession :: changeSessionName : セッション名を変更できませんでした ", e))
      .finally(() => {
        setFlags({...flags(), changingName: false});
        setModalNameChangingOpen(false);
      });
  };

  onMount(sessionFetcher);

  return (
    <div class="md:max-w-[750px] h-full flex flex-col mx-auto">

      {/* セッションログアウト確認用モーダル */}
      <Dialog open={modalDeletionOpen()} onOpenChange={setModalDeletionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>セッションの遠隔ログアウト</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>遠隔でセッションをログアウトします。よろしいですか？</p>
            <span class="truncate flex items-center gap-2">
              <p class="shrink-0">ログアウトするセッション:</p>
              <span class="font-bold truncate w-32 md:w-[256px]">{ targetDeletingSession?.name ?? "?" }</span>
            </span>
          </DialogDescription>
          <DialogFooter>
            <Button
              onClick={()=>setModalDeletionOpen(false)}
              variant={"ghost"}
              disabled={flags().deleting}
            >キャンセル</Button>
            <Button
              onClick={()=>{removeSession(targetDeletingSession?.id || 0)}}
              variant={"destructive"}
              disabled={flags().deleting}
            >ログアウトする</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* セッション名変更用モーダル */}
      <Dialog open={modalNameChangingOpen()} onOpenChange={setModalNameChangingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>セッション名の変更</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            <p>変更先のセッション名を入力してください。</p>
            <span class="flex truncate items-center gap-2">
              <p>現在 : </p>
              <span class="font-bold truncate overflow-x-auto w-64 md:w-[256px]">{ targetNameChangingSession?.name ?? "?" }</span>
            </span>
          </DialogDescription>
          <TextField>
            <TextFieldInput
              type="text"
              value={newSessionName()}
              onChange={(e) => setNewSessionName(e.currentTarget.value)}
              disabled={flags().changingName}
            />
          </TextField>
          <DialogFooter>
            <Button
              onClick={()=>setModalNameChangingOpen(false)}
              variant={"ghost"}
              disabled={flags().changingName}
            >キャンセル</Button>
            <Button onClick={()=>changeSessionName()} disabled={flags().changingName}>変更する</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <span class="flex flex-row items-center gap-2">
        <p class="font-bold text-2xl my-2">セッション管理</p>
        <Button
          onClick={()=>sessionFetcher()}
          class="ml-auto"
          size={"icon"}
          variant={"secondary"}
        >
          <IconReload />
        </Button>
      </span>

      <hr class="mt-2" />

      <div class="flex flex-col shrink overflow-y-auto gap-2 py-4">
        <For each={sessions()}>
          {(session) => (
            <Card class="p-4 flex flex-col md:flex-row item-start md:items-center gap-2">
              <span class="truncate shrink flex flex-row items-center gap-2">
                <Button
                  onClick={()=>{ targetNameChangingSession = session; setModalNameChangingOpen(true); }}
                  class="shrink-0"
                  size={"icon"}
                  variant={"ghost"}
                >
                  <IconPencil />
                </Button>
                <p class="truncate shrink">{ session.name }</p>
              </span>
              <span class="shrink-0 ml-auto flex flex-row items-center gap-4">
                <Badge variant={"outline"}>{ new Date(session.createdAt).toLocaleString() }</Badge>
                <Show when={!session.thisIsYou}>
                  <Button
                    onClick={()=>{ targetDeletingSession=session; setModalDeletionOpen(true); }}
                    size={"sm"}
                    variant={"destructive"}
                  >
                    <IconTrash />
                    ログアウト
                  </Button>
                </Show>
                <Show when={session.thisIsYou}>
                  <Badge class="shrink-0">あなた</Badge>
                </Show>
              </span>
            </Card>
          )}
        </For>
        <Show when={flags().fetching}>
          <p class="text-center">ロード中...</p>
        </Show>
        <Show when={!reachedSessionEnd}>
          <Button class="mx-auto" variant={"secondary"}>セッションをさらに読み込む</Button>
        </Show>
      </div>

    </div>
  )
}
