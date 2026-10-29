import { onShow, onHide, onUnload } from "@dcloudio/uni-app";

/**
 * 页面可见期间定时刷新，用于商家把工作台一直开着时也能看到 C 端刚产生的订单/消息。
 * onHide 停表、onShow 重新起表，切到其他页面或小程序退到后台时不会空转。
 * 首次数据仍由页面自己的 onShow 拉取，这里只负责后续的轮询。
 */
export function usePolling(task: () => unknown, intervalMs = 30000) {
  let timer: ReturnType<typeof setInterval> | null = null;

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  onShow(() => {
    stop();
    timer = setInterval(() => void task(), intervalMs);
  });
  onHide(stop);
  onUnload(stop);
}
