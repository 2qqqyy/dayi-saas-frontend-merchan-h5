import type { ApiResponse, MerchantInfo, MerchantStatus } from "@/types/business";
import request from "@/utils/request";
import { mapMerchant } from "@/utils/backend";

/** 当前商户资料（对应后端 GET /api/merchant/profile） */
export async function getMerchantInfo(): Promise<ApiResponse<MerchantInfo>> {
  const res: any = await request.get("/profile");
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: mapMerchant(res?.data),
  };
}

/** 资料页可编辑的字段；后端 PUT /profile 已按 null 跳过，未提交字段保持原值 */
const EDITABLE_FIELDS = [
  "name",
  "contact",
  "mobile",
  "address",
  "intro",
  "businessScope",
  "openTime",
  "shopNotice",
] as const;

/**
 * 更新商户资料
 * 后端 DTO 的 name/type/contact/mobile 有 @NotBlank/@NotNull 校验，
 * 因此回填 store 中保存的原始值；其余只提交资料页真正编辑过的字段，
 * 避免把营业执照、门店照片、结算账户等未编辑字段覆盖成空串。
 */
export async function updateMerchantInfo(
  payload: Partial<MerchantInfo>,
): Promise<ApiResponse<MerchantInfo>> {
  const raw = (payload as any)._raw ?? {};
  const body: Record<string, any> = {
    type: raw.type ?? 1,
    villageId: raw.villageId ?? 1,
  };
  for (const key of EDITABLE_FIELDS) {
    const value = (payload as any)[key];
    if (value !== undefined) body[key] = value;
  }
  const res: any = await request.put("/profile", body);
  if (res?.code !== 0) {
    return { code: res?.code ?? -1, message: res?.message ?? "保存失败", data: null as any };
  }
  // 后端返回 Result<Void>，更新后重新拉取最新资料
  const latest: any = await request.get("/profile");
  return {
    code: 0,
    message: res?.message ?? "ok",
    data: mapMerchant(latest?.data),
  };
}

/** 更换头像：独立接口，不走 PUT /profile 的必填校验 */
export async function updateMerchantAvatar(avatar: string): Promise<ApiResponse<MerchantInfo>> {
  const res: any = await request.put("/avatar", { avatar });
  if (res?.code !== 0) {
    return { code: res?.code ?? -1, message: res?.message ?? "保存失败", data: null as any };
  }
  const latest: any = await request.get("/profile");
  return {
    code: 0,
    message: res?.message ?? "ok",
    data: mapMerchant(latest?.data),
  };
}

/** 营业状态：H5 的 OPEN/CLOSED 落到后端 merchant.status（1=营业中 / 0=歇业） */
export async function updateMerchantStatus(
  status: MerchantStatus,
): Promise<ApiResponse<MerchantInfo>> {
  const res: any = await request.put("/status", { status: status === "OPEN" ? 1 : 0 });
  if (res?.code !== 0) {
    return { code: res?.code ?? -1, message: res?.message ?? "状态更新失败", data: null as any };
  }
  const latest: any = await request.get("/profile");
  return { code: 0, message: "ok", data: mapMerchant(latest?.data) };
}

/** 修改登录密码：后端无 password_hash 时按演示初始密码 123456 校验原密码 */
export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<ApiResponse<null>> {
  const res: any = await request.post("/password", { oldPassword, newPassword });
  return { code: res?.code ?? -1, message: res?.message ?? "请求失败", data: null };
}

/** 商户类型：与 merchant.type 注释一致（1种植户 2民宿 3工坊 4农家乐） */
export const MERCHANT_TYPE_OPTIONS = [
  { value: 1, label: "种植户" },
  { value: 2, label: "民宿" },
  { value: 3, label: "工坊" },
  { value: 4, label: "农家乐" },
];

export interface MerchantApplyPayload {
  name: string;
  type: number;
  contact: string;
  mobile: string;
  address?: string;
  businessScope?: string;
  intro?: string;
}

/**
 * 自助入驻申请（登录前提交）
 * 后端 POST /api/merchant/apply/public 按手机号查重，写入待审核商户。
 */
export async function applyMerchant(payload: MerchantApplyPayload): Promise<void> {
  const res: any = await request.post("/apply/public", { ...payload, villageId: 1 });
  if (res?.code !== 0) {
    throw new Error(res?.message || "提交失败");
  }
}
