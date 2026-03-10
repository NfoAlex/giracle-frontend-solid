import { storeClientConfig } from "~/stores/ClientConfig.ts";
import { Card } from "../ui/card.tsx";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "../ui/slider";
import { useColorMode } from "@kobalte/core/color-mode";
import { IconBrush, IconLink, IconMoonFilled, IconSpacingVertical, IconSunFilled } from "@tabler/icons-solidjs";
import { NumberField, NumberFieldDecrementTrigger, NumberFieldGroup, NumberFieldIncrementTrigger, NumberFieldInput } from "../ui/number-field.tsx";

export default function ConfigDisplay() {
  const { setColorMode, colorMode } = useColorMode()

  return (
    <div class="flex flex-col gap-6">

      {/* テーマ */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <span class="font-bold flex items-center gap-2">
            <IconBrush />
            テーマ
          </span>
          <div class={"ml-auto flex items-center gap-2"}>
            <p class="italic text-sm">クリックで変更</p>
            {colorMode() === "dark" && <IconMoonFilled onClick={() => setColorMode("light")} />}
            {colorMode() === "light" && <IconSunFilled onClick={() => setColorMode("dark")} />}
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
          <span class="font-bold flex items-center gap-2">
            <IconSpacingVertical />
            メッセージ間の空白
          </span>
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
              <p>2</p>
              <p>4</p>
              <p>6</p>
            </div>
          </span>
        </span>

        <hr />

        <div>
          チャット画面でのメッセージ間の余白縦幅を調整します。
        </div>
      </Card>

      {/* URLプレビュー概要の最大文字数 */}
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex flex-col gap-4">
          <span class="font-bold flex items-center gap-2">
            <IconLink />
            URLプレビュー概要の最大文字数
          </span>
          <span class="flex flex-col gap-2">
            <NumberField
              class="w-1/2 flex items-center gap-2"
              value={storeClientConfig.display.maxUrlPreviewTextLength}
              defaultValue={512 * 1024 * 1024} // 512MB
              onRawValueChange={(e) => storeClientConfig.display.maxUrlPreviewTextLength = e}
              validationState={storeClientConfig.display.maxUrlPreviewTextLength <= 0 ? "invalid" : "valid"}
            >
              <NumberFieldGroup class="w-36">
                <NumberFieldInput />
                <NumberFieldIncrementTrigger />
                <NumberFieldDecrementTrigger />
              </NumberFieldGroup>
              <span class="grow shrink-0">文字</span>
            </NumberField>
          </span>
        </span>

        <hr />

        <div>
          URLプレビュー概要の最大文字数を設定します。
          <br />
          省略された場合はモーダル表示で全文を読むことができます。
        </div>
      </Card>
    </div>
  )
}
