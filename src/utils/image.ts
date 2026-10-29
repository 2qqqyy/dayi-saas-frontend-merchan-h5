import { resolveFileUrl } from "@/utils/upload";

/** 图片地址为空/加载失败时的内置占位图（本地 data URI，不依赖网络） */
export const FALLBACK_IMAGE =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCA0MDAgMzAwJz48cmVjdCB3aWR0aD0nNDAwJyBoZWlnaHQ9JzMwMCcgZmlsbD0nI2VlZjFlYycvPjxnIGZpbGw9JyM4ZDljODgnIHRleHQtYW5jaG9yPSdtaWRkbGUnIGZvbnQtZmFtaWx5PSdNaWNyb3NvZnQgWWFIZWksQXJpYWwsc2Fucy1zZXJpZic+PHRleHQgeD0nMjAwJyB5PScxNDInIGZvbnQtc2l6ZT0nMzAnIGZvbnQtd2VpZ2h0PSdib2xkJz7pnZLmooXph4w8L3RleHQ+PHRleHQgeD0nMjAwJyB5PScxODAnIGZvbnQtc2l6ZT0nMTknPuaaguaXoOWbvueJhzwvdGV4dD48L2c+PC9zdmc+";

/**
 * 列表/详情图片渲染地址。
 * 只用于展示：编辑表单回填要保留原始相对路径，否则占位图会被写回数据库。
 */
export function imgSrc(url: unknown): string {
  return resolveFileUrl(String(url ?? "")) || FALLBACK_IMAGE;
}
