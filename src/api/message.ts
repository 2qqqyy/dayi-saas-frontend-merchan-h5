import type { ApiResponse, MessageItem, MessageType } from "@/types/business";
import request from "@/utils/request";

const READ_KEY = "merchant-h5-msg-read";

function readSet(): Set<string> {
  try {
    const raw = uni.getStorageSync(READ_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set<string>();
  }
}

function saveRead(set: Set<string>) {
  uni.setStorageSync(READ_KEY, JSON.stringify([...set]));
}

function adapt(raw: any, read: Set<string>): MessageItem {
  const id = String(raw.id);
  return {
    id,
    merchantId: String(raw.merchantId ?? ""),
    type: (raw.type ?? "SYSTEM") as MessageType,
    title: String(raw.title ?? ""),
    titleEn: raw.titleEn ? String(raw.titleEn) : undefined,
    content: String(raw.content ?? ""),
    contentEn: raw.contentEn ? String(raw.contentEn) : undefined,
    time: String(raw.time ?? ""),
    read: read.has(id),
    orderId: raw.orderId != null ? String(raw.orderId) : undefined,
  };
}

/** 消息列表（由后端基于订单事件动态生成，已读状态本地维护） */
export async function getMessages(): Promise<ApiResponse<MessageItem[]>> {
  const res: any = await request.get("/messages");
  const list = Array.isArray(res?.data) ? res.data : [];
  const read = readSet();
  return { code: 0, message: "ok", data: list.map((m: any) => adapt(m, read)) };
}

export async function getUnreadCount(): Promise<ApiResponse<number>> {
  // 优先走后端专用的未读计数接口（只返回待处理数量，比拉全量列表轻量）
  try {
    const res: any = await request.get("/messages/unread-count");
    const n = Number(res?.data);
    if (Number.isFinite(n)) return { code: 0, message: "ok", data: n };
  } catch {
    /* 回退到本地计算 */
  }
  const res: any = await getMessages();
  return {
    code: 0,
    message: "ok",
    data: (res.data as MessageItem[]).filter((m) => !m.read).length,
  };
}

export async function markRead(id: string): Promise<ApiResponse<boolean>> {
  const set = readSet();
  set.add(String(id));
  saveRead(set);
  return { code: 0, message: "ok", data: true };
}

export async function markAllRead(): Promise<ApiResponse<boolean>> {
  const res: any = await getMessages();
  const set = readSet();
  res.data.forEach((m: MessageItem) => set.add(m.id));
  saveRead(set);
  return { code: 0, message: "ok", data: true };
}
