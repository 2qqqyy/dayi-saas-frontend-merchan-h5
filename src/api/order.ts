import type { ApiResponse, Order } from "@/types/business";
import request from "@/utils/request";
import { mapOrder, toBackendOrderStatus } from "@/utils/backend";

/** 订单类型 → 后端路径前缀 */
const PATH: Record<string, string> = {
  PICKING: "picking",
  HOMESTAY: "homestay",
  PRODUCT: "product",
};

function adapt(raw: any): Order {
  return mapOrder(raw);
}

/**
 * 查询订单列表（聚合采摘 / 民宿 / 商品三类）
 * 后端按订单类型拆分为 3 个接口，这里合并后按创建时间倒序。
 * @param status H5 状态（如 WAIT_VERIFY）或 "all"/undefined 表示全部
 * @param type   可选，限定订单类型 PICKING|HOMESTAY|PRODUCT；默认全部
 */
export async function getOrders(status?: string, type?: string): Promise<ApiResponse<Order[]>> {
  const types = type && type !== "all" ? [type] : ["PICKING", "HOMESTAY", "PRODUCT"];
  const statusParam = status && status !== "all" ? toBackendOrderStatus(status) : undefined;

  const results = await Promise.all(
    types.map(async (t) => {
      const res: any = await request.get(`/${PATH[t]}/orders`, {
        params: { page: 1, pageSize: 100, ...(statusParam ? { status: statusParam } : {}) },
      });
      const list = res?.data?.list ?? res?.data ?? [];
      return (Array.isArray(list) ? list : []).map(adapt);
    }),
  );

  const merged = results.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { code: 0, message: "ok", data: merged };
}

export async function getOrderDetail(id: string): Promise<ApiResponse<Order | null>> {
  const res: any = await request.get(`/orders/${id}`);
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: res?.data ? adapt(res.data) : null,
  };
}

/** 发货：后端 POST /api/merchant/orders/{id}/ship */
export async function shipOrder(
  id: string,
  company: string,
  trackingNo: string,
): Promise<ApiResponse<Order | null>> {
  const res: any = await request.post(`/orders/${id}/ship`, { company, trackingNo });
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: res?.data ? adapt(res.data) : null,
  };
}

/** 同意退款：后端 POST /api/merchant/orders/{id}/refund/approve */
export async function refundApprove(id: string): Promise<ApiResponse<Order | null>> {
  const res: any = await request.post(`/orders/${id}/refund/approve`);
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: res?.data ? adapt(res.data) : null,
  };
}

/** 拒绝退款：后端 POST /api/merchant/orders/{id}/refund/reject */
export async function refundReject(
  id: string,
  reason: string,
): Promise<ApiResponse<Order | null>> {
  const res: any = await request.post(`/orders/${id}/refund/reject`, { reason });
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: res?.data ? adapt(res.data) : null,
  };
}

/** 拒绝预约：待核销采摘单由商家取消并全额退款（名额自动释放） */
export async function rejectReservation(id: number | string, reason: string) {
  const res: any = await request.post(`/orders/${id}/reject-reservation`, { reason });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: res?.data };
}
