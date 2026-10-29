import { TAB_PAGES } from "@/utils/constants";

export function go(path: string) {
  // uni.navigateTo 不允许打开 tabBar 页面；带 ?query 的 tab 路径（如
  // pages/order/index?tab=WAIT_VERIFY）若直接走 navigateTo 会静默失败，
  // 因此先剥离 query 再判断是否 tab 页。tab 页统一 reLaunch 并保留 query，
  // 订单页在 onLoad 中读取 q.tab 恢复所选标签。
  const [base, query] = path.split("?");
  if (TAB_PAGES.includes(base)) {
    uni.reLaunch({ url: `/${base}${query ? `?${query}` : ""}` });
    return;
  }
  uni.navigateTo({ url: `/${path}` });
}

export function goBack() {
  const pages = getCurrentPages();
  if (pages.length > 1) {
    uni.navigateBack();
    return;
  }
  uni.reLaunch({ url: "/pages/index/index" });
}

export function requireLogin(nextPath?: string) {
  uni.reLaunch({
    url: nextPath
      ? `/pages/user/login?redirect=${encodeURIComponent(`/${nextPath}`)}`
      : "/pages/user/login",
  });
}
