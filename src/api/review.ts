import type { ApiResponse } from "@/types/business";
import request from "@/utils/request";

export interface MerchantReview {
  id: number;
  orderId: number;
  userId: number;
  type: number;
  score: number;
  content: string;
  images?: string;
  reply?: string;
  replyTime?: string;
  status: number;
  createTime: string;
}

export async function getReviews(page = 1, pageSize = 10): Promise<ApiResponse<{ list: MerchantReview[]; total: number }>> {
  const res: any = await request.get("/reviews", { params: { page, pageSize } });
  const d = res?.data ?? {};
  return {
    code: 0,
    message: "ok",
    data: { list: Array.isArray(d.list) ? d.list : Array.isArray(d.records) ? d.records : [], total: Number(d.total ?? 0) },
  };
}

export async function replyReview(id: number, reply: string): Promise<ApiResponse<boolean>> {
  const res: any = await request.post(`/reviews/${id}/reply`, { reply });
  if (res?.code !== 0) {
    return { code: res?.code ?? -1, message: res?.message ?? "回复失败", data: false };
  }
  return { code: 0, message: "ok", data: true };
}
