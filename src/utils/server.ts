/**
 * 后端地址的唯一出口。
 *
 * H5 走 vite 代理（/merchant-api、/api、/uploads 三条规则，见 vite.config.ts），
 * 相对路径即可；小程序逻辑层没有代理这一层，也没有 XMLHttpRequest，
 * 必须绝对地址 + uni.request，所以统一从这里取。
 */
export const isMiniProgram = (process.env.UNI_PLATFORM || "h5") !== "h5";

/**
 * 默认指向 127.0.0.1，供开发者工具模拟器使用（模拟器与后端同机）。
 * 真机预览必须覆盖成电脑的局域网 IP：
 *   VITE_MP_SERVER=http://192.168.1.10:8080 npm run dev:mp-weixin
 */
export const MP_SERVER = import.meta.env.VITE_MP_SERVER || "http://127.0.0.1:8080";

/** 把 /api/... 或 /uploads/... 这类后端相对路径补成小程序可用的绝对地址 */
export function serverUrl(path: string): string {
  if (!isMiniProgram) return path;
  return /^https?:\/\//i.test(path) ? path : MP_SERVER + path;
}
