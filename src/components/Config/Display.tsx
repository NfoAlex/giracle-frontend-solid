import { storeClientConfig } from "~/stores/ClientConfig";
import { Card } from "../ui/card";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "../ui/slider";
import { useColorMode } from "@kobalte/core/color-mode";
import { IconMoonFilled, IconSunFilled } from "@tabler/icons-solidjs";

export default function Display() {
  const { setColorMode, colorMode } = useColorMode()
  
  return (
    <div class="flex flex-col gap-6">

      {/* テーマ */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <p class="font-bold">アプリテーマ</p>
          <div class={"ml-auto"}>
            {colorMode() === "dark" && <IconMoonFilled onClick={()=>setColorMode("light")} />}
            {colorMode() === "light" && <IconSunFilled onClick={()=>setColorMode("dark")} />}
          </div>
        </span>

        <hr />

        <div>
          アプリの明暗テーマを選択します。デフォルトの値はシステムのテーマに従います。
        </div>
      </Card>

      {/* メッセージ間余白設定 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex flex-col gap-4">
          <p class="font-bold">メッセージ間の空白</p>
          <span class="flex flex-col gap-2">
            <Slider
              step={1}
              minValue={0}
              maxValue={6}
              defaultValue={[storeClientConfig.display.messageGapLevel]}
              onChange={(v) => storeClientConfig.display.messageGapLevel = v[0]}
            >
              <SliderTrack>
                <SliderFill />
                <SliderThumb />
              </SliderTrack>
            </Slider>
            <div class="flex items-center justify-between">
              <p>0</p>
              <p>3</p>
              <p>6</p>
            </div>
          </span>
        </span>

        <hr />

        <div>
          チャット画面でのメッセージ間の余白縦幅を調整します。
        </div>
      </Card>
    </div>
  )
}