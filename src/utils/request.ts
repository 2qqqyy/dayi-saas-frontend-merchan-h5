import axios, {
  AxiosError,
  type AxiosAdapter,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage } from "@/utils/storage";
import { isMiniProgram, MP_SERVER } from "@/utils/server";
import { tr } from "@/utils/i18n";

/**
 * 商家端 H5 真实后端接入层
 *
 * 后端统一响应：{ code: 200, msg, data }
 * H5 期望响应：{ code: 0, message, data }
 * 这里在响应拦截器里做一次归一化，使 api 层与页面无需感知后端契约差异。
 */
type UniMethod = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS";

function toQuery(params?: Record<string, unknown>): string {
  if (!params) return "";
  const parts: string[] = [];
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    (Array.isArray(value) ? value : [value]).forEach((item) => {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`);
    });
  });
  return parts.join("&");
}

function toHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
  const raw = (config.headers?.toJSON?.() ?? config.headers ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (value !== undefined && value !== null) out[key] = String(value);
  });
  return out;
}

/**
 * 小程序逻辑层没有 XMLHttpRequest，axios 内置的 xhr / fetch 适配器全都不可用，
 * 必须显式挂 uni.request 适配器。用编译期常量判断：模拟器里 XMLHttpRequest 存在，
 * 运行时特性探测会误判成 H5，导致适配器不挂载、所有请求发不出去。
 */
const uniAdapter: AxiosAdapter = (config) =>
  new Promise<AxiosResponse>((resolve, reject) => {
    const raw = config.url || "";
    const full = /^https?:\/\//i.test(raw) ? raw : (config.baseURL || "") + raw;
    const query = toQuery(config.params as Record<string, unknown> | undefined);
    uni.request({
      url: query ? `${full}${full.includes("?") ? "&" : "?"}${query}` : full,
      method: (config.method || "GET").toUpperCase() as UniMethod,
      data: config.data,
      header: toHeaders(config),
      timeout: config.timeout,
      dataType: "json",
      success: (res) => {
        const response = {
          data: res.data,
          status: res.statusCode,
          statusText: String(res.statusCode),
          headers: res.header,
          config,
          request: null,
        } as unknown as AxiosResponse;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(response);
          return;
        }
        const code =
          res.statusCode >= 400 && res.statusCode < 500
            ? AxiosError.ERR_BAD_REQUEST
            : AxiosError.ERR_BAD_RESPONSE;
        reject(
          new AxiosError(
            `Request failed with status code ${res.statusCode}`,
            code,
            config,
            null,
            response,
          ),
        );
      },
      fail: (err) =>
        reject(new AxiosError(err.errMsg || "Network Error", AxiosError.ERR_NETWORK, config, null)),
    });
  });

const service = axios.create({
  // H5 由 vite proxy 将 /merchant-api 转发到后端 /api/merchant；小程序没有代理这一层
  baseURL: isMiniProgram ? `${MP_SERVER}/api/merchant` : "/merchant-api",
  timeout: 15000,
  ...(isMiniProgram ? { adapter: uniAdapter } : {}),
});

service.interceptors.request.use((config) => {
  // 注意：token 经 setStorage 存入时是 JSON 序列化字符串，
  // 必须用 getStorage 解析取出，否则 Bearer 头会带引号导致后端 401
  const token = getStorage<string>(STORAGE_KEYS.token, "");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

service.interceptors.response.use(
  (response) => {
    const body = response.data;
    // 归一化：code 200 -> 0（H5 约定成功为 0），msg -> message
    if (body && typeof body === "object" && "code" in body) {
      const rawCode = Number(body.code);
      const ok = rawCode === 200 || rawCode === 0;
      return {
        code: ok ? 0 : rawCode,
        message: body.msg ?? body.message ?? (ok ? "ok" : "请求失败"),
        data: body.data,
      };
    }
    return body;
  },
  (error) => {
    const status = error.response?.status;
    if (status === 401) {
      uni.removeStorageSync(STORAGE_KEYS.token);
      uni.removeStorageSync(STORAGE_KEYS.merchant);
      uni.reLaunch({ url: "/pages/user/login" });
      uni.showToast({ title: tr("登录已过期，请重新登录"), icon: "none" });
      return Promise.reject(new Error(tr("登录已过期，请重新登录")));
    }
    const body = error.response?.data;
    const msg = body?.msg ?? body?.message ?? error.message ?? "请求失败";
    uni.showToast({ title: msg, icon: "none" });
    const err: any = new Error(msg);
    err.code = body?.code ?? status;
    return Promise.reject(err);
  },
);

export default service;

/**
 * 公共接口实例（主题表 /common/appearance 等）。
 * 这些接口不在 /api/merchant 前缀下，也不该被 401 拦截器踢回登录页。
 */
export const publicService = axios.create({
  baseURL: isMiniProgram ? `${MP_SERVER}/api` : "/api",
  timeout: 15000,
  ...(isMiniProgram ? { adapter: uniAdapter } : {}),
});

publicService.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body && typeof body === "object" && "code" in body) {
      const rawCode = Number(body.code);
      const ok = rawCode === 200 || rawCode === 0;
      return {
        code: ok ? 0 : rawCode,
        message: body.msg ?? body.message ?? (ok ? "ok" : "请求失败"),
        data: body.data,
      };
    }
    return body;
  },
  (error) => {
    const body = error.response?.data;
    const msg = body?.msg ?? body?.message ?? error.message ?? "请求失败";
    const err: any = new Error(msg);
    err.code = body?.code ?? error.response?.status;
    return Promise.reject(err);
  },
);
