import type { ApiResponse, Order, VerifyResult } from "@/types/business";
import request from "@/utils/request";
import { mapOrder } from "@/utils/backend";

/**
 * 查询核销码对应订单（不修改状态）
 * 后端 GET /api/merchant/picking/orders/verify-query?code=
 */
export async function queryVerifyOrder(code: string): Promise<ApiResponse<Order | null>> {
  try {
    const res: any = await request.get("/picking/orders/verify-query", { params: { code } });
    if (res?.code !== 0) {
      return { code: res?.code ?? 500, message: res?.message ?? "核销码无效", data: null };
    }
    return { code: 0, message: "ok", data: res?.data ? mapOrder(res.data) : null };
  } catch (e: any) {
    return { code: e?.code ?? 500, message: e?.message ?? "核销码无效", data: null };
  }
}

/**
 * 核销采摘订单
 * 后端 POST /api/merchant/picking/orders/verify-by-code?code=
 * 后端已完成全部业务判断（码无效 / 已核销 / 非本商户 / 状态不可核销）
 */
export async function verifyOrder(code: string): Promise<ApiResponse<VerifyResult>> {
  try {
    const res: any = await request.post("/picking/orders/verify-by-code", null, {
      params: { code },
    });
    if (res?.code === 0) {
      return {
        code: 0,
        message: "ok",
        data: { success: true, order: res?.data ? mapOrder(res.data) : undefined },
      };
    }
    return {
      code: res?.code ?? 500,
      message: res?.message ?? "核销失败",
      data: { success: false, reason: res?.message ?? "核销失败" },
    };
  } catch (e: any) {
    return {
      code: e?.code ?? 500,
      message: e?.message ?? "核销失败",
      data: { success: false, reason: e?.message ?? "核销失败" },
    };
  }
}
