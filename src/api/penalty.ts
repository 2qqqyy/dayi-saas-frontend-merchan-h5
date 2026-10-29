import type { ApiResponse } from "@/types/business";
import request from "@/utils/request";

export interface PenaltyRecord {
  id: number;
  merchantId: number;
  type: "WARNING" | "DEDUCT" | "SUSPEND";
  points: number;
  reason: string;
  source?: string;
  status: number;
  startTime?: string;
  endTime?: string;
  createTime: string;
}

export const PENALTY_TYPE: Record<string, string> = {
  WARNING: "警告",
  DEDUCT: "扣分",
  SUSPEND: "暂停营业",
};

export async function getPenalties(): Promise<
  ApiResponse<{ points: number; suspended: boolean; list: PenaltyRecord[] }>
> {
  const res: any = await request.get("/penalties");
  const d = res?.data ?? {};
  return {
    code: 0,
    message: "ok",
    data: {
      points: Number(d.points ?? 0),
      suspended: !!d.suspended,
      list: Array.isArray(d.list) ? d.list : [],
    },
  };
}
