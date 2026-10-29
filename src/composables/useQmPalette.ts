import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { loadPrefs, paletteOf, type QmPalette } from "@/utils/appearance";

/**
 * 主题色（JS 侧）：给 echarts 画布、switch 的 color 属性这类不吃 CSS 变量的地方用。
 * 页面 onShow 时重新取一次，从「外观」页返回后图表颜色会立刻跟上。
 */
export function useQmPalette() {
  const prefs = ref(loadPrefs());
  onShow(() => {
    prefs.value = loadPrefs();
  });
  return computed<QmPalette>(() => paletteOf(prefs.value));
}
