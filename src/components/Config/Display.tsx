import { Card } from "../ui/card";
import { Slider, SliderFill, SliderThumb, SliderTrack } from "../ui/slider";

export default function Display() {
  return (
    <div class="flex flex-col gap-6">
      <Card class="p-4 flex flex-col gap-4">
        <span class="flex items-center">
          <p class="font-bold">アプリテーマ</p>
          <p class="ml-auto">asdf</p>
        </span>

        <hr />

        <div>
          アプリの明暗テーマを選択します。デフォルトの値はシステムのテーマに従います。
        </div>
      </Card>

      <Card class="p-4 flex flex-col gap-4">
        <span class="flex flex-col gap-4">
          <p>メッセージ間の空白</p>
          <Slider step={1} minValue={0} maxValue={6} defaultValue={[1]} >
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
          </Slider>
        </span>

        <hr />
        
        <div>
          チャット画面でのメッセージ間の余白縦幅を調整します。
        </div>
      </Card>
    </div>
  )
}