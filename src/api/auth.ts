import type { ApiResponse, LoginResult, MerchantInfo } from "@/types/business";
import request from "@/utils/request";
import { mapMerchant } from "@/utils/backend";

export interface LoginPayload {
  mobile: string;
  code: string;
  method: "password" | "sms";
}

/** 发送短信验证码（后端演示模式固定 123456） */
export async function sendSmsCode(mobile: string): Promise<ApiResponse<{ expire: number }>> {
  return request.post("/auth/sms/code", { mobile }) as any;
}

export async function login(payload: LoginPayload): Promise<ApiResponse<LoginResult>> {
  const res: any = await request.post("/login", {
    mobile: payload.mobile,
    code: payload.code,
    method: payload.method,
  });
  // 归一化拦截器把后端 code:200 映射为 0；后端业务失败（HTTP 200 + code:500）
  // 会以 code!==0 返回，此处必须抛错，否则登录页会把失败当成功跳转。
  if (res?.code !== 0) {
    throw new Error(res?.message || "登录失败");
  }
  const data = res?.data ?? {};
  const merchantInfo: MerchantInfo = mapMerchant(data.merchantInfo);
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: {
      token: data.token ?? "",
      merchantId: String(data.merchantId ?? merchantInfo.id ?? ""),
      merchantInfo,
    },
  };
}

/** 登出（后端 POST /api/merchant/logout 清理服务端上下文） */
export async function logout(): Promise<ApiResponse<null>> {
  return request.post("/logout", null) as any;
}
