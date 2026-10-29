import { serverUrl } from "@/utils/server";

/**
 * 读取后台「系统配置」的公开项。
 *
 * 商家端 axios 实例的 baseURL 固定在 /merchant-api（→ 后端 /api/merchant），
 * 而 /api/common/** 是不带前缀的公共接口，所以这里单独走 uni.request，
 * 与 utils/upload.ts 里上传接口同样的处理方式。
 */
export function getPublicConfigs(keys: string[]): Promise<Record<string, string>> {
  return new Promise((resolve) => {
    uni.request({
      url: serverUrl(`/api/common/configs?keys=${keys.join(",")}`),
      success: (res: any) => {
        const data = res?.data?.data;
        resolve(data && typeof data === "object" ? (data as Record<string, string>) : {});
      },
      fail: () => resolve({}),
    });
  });
}
