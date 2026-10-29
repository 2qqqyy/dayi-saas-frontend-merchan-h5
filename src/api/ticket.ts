import request from "@/utils/request";
import type { ApiResponse } from "@/types/business";

export interface MTicket {
  id: number;
  ticketNo: string;
  userId: number;
  orderId?: number;
  category: string;
  title: string;
  status: number;
  priority: number;
  createTime: string;
  updateTime: string;
}

export interface MTicketMessage {
  id: number;
  senderType: "USER" | "MERCHANT" | "ADMIN";
  senderName: string;
  content: string;
  createTime: string;
}

export interface MTicketRow {
  ticket: MTicket;
  userName?: string;
  lastMessage?: string;
}

export const TICKET_STATUS: Record<number, string> = { 0: "待处理", 1: "处理中", 2: "已解决", 3: "已关闭" };
export const TICKET_CATEGORY: Record<string, string> = {
  AFTER_SALE: "售后问题",
  REFUND: "退款纠纷",
  COMPLAINT: "投诉商家",
  OTHER: "其他咨询",
};

export async function getTickets(status?: number): Promise<ApiResponse<MTicketRow[]>> {
  const res: any = await request.get("/tickets", { params: { page: 1, pageSize: 50, status } });
  const d = res?.data ?? {};
  return { code: 0, message: "ok", data: Array.isArray(d.list) ? d.list : [] };
}

export async function getTicketDetail(id: number | string): Promise<
  ApiResponse<{ ticket: MTicket; messages: MTicketMessage[]; userName?: string } | null>
> {
  const res: any = await request.get(`/tickets/${id}`);
  const ok = res?.code === 0 || res?.code === 200;
  if (!ok) return { code: res?.code ?? -1, message: res?.message ?? "加载失败", data: null };
  return { code: 0, message: "ok", data: res.data };
}

export async function replyTicket(id: number | string, content: string): Promise<ApiResponse<boolean>> {
  const res: any = await request.post(`/tickets/${id}/messages`, { content });
  return { code: res?.code === 0 || res?.code === 200 ? 0 : (res?.code ?? -1), message: res?.message ?? "ok", data: res?.code === 0 || res?.code === 200 };
}

export async function updateTicketStatus(id: number | string, status: number): Promise<ApiResponse<boolean>> {
  const res: any = await request.put(`/tickets/${id}/status`, { status });
  return { code: res?.code === 0 || res?.code === 200 ? 0 : (res?.code ?? -1), message: res?.message ?? "ok", data: res?.code === 0 || res?.code === 200 };
}
