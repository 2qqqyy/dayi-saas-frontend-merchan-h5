import { computed } from "vue";
import { loadPrefs, prefsClass, prefsVersion } from "@/utils/appearance";

/**
 * 页面根节点的外观类名。
 *
 * H5 由 App.vue 写到 <html>，小程序没有 DOM，只能把同一组类挂在页面根节点上，
 * 因此每个页面根 view 都要绑定这个值，主题 / 关怀模式 / 深色才会生效。
 * 用 computed 订阅 prefsVersion：在外观页点切换时本页类名同帧跟着变，不用等 onShow。
 */
export function useQmClass() {
  return computed(() => {
    void prefsVersion.v;
    return prefsClass(loadPrefs());
  });
}
