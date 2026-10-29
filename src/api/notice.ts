import request from "@/utils/request";
import { toStr, toNum } from "@/utils/backend";

/**
 * 平台公告（商家侧）
 * 后端 GET /api/merchant/notices 按 audience=MERCHANT|ALL 下发，并带该商户的已读状态，
 * 已读落在 notice_read 表，不是本地标记。
 */
export interface MerchantNotice {
  id: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  category: string;
  pinned: boolean;
  publishTime: string;
  read: boolean;
  content: string;
  contentEn: string;
}

function mapNotice(raw: any): MerchantNotice {
  return {
    id: toStr(raw?.id),
    title: toStr(raw?.title),
    titleEn: toStr(raw?.titleEn),
    summary: toStr(raw?.summary),
    summaryEn: toStr(raw?.summaryEn),
    category: toStr(raw?.category, "NOTICE"),
    pinned: raw?.pinned === true || toNum(raw?.pinned) === 1,
    publishTime: toStr(raw?.publishTime),
    read: raw?.read === true,
    content: toStr(raw?.content),
    contentEn: toStr(raw?.contentEn),
  };
}

export async function getNotices(limit = 30): Promise<MerchantNotice[]> {
  const res: any = await request.get("/notices", { params: { limit } });
  const list = res?.data;
  return Array.isArray(list) ? list.map(mapNotice) : [];
}

export async function getNoticeUnread(): Promise<number> {
  const res: any = await request.get("/notices/unread-count");
  return toNum(res?.data, 0);
}

export async function getNoticeDetail(id: string): Promise<MerchantNotice> {
  const res: any = await request.get(`/notices/${id}`);
  return mapNotice(res?.data);
}

export async function markNoticeRead(id: string): Promise<void> {
  await request.post(`/notices/${id}/read`);
}

export const NOTICE_CATEGORY_TEXT: Record<string, string> = {
  NOTICE: "村务提醒",
  ACTIVITY: "山野活动",
  SERVICE: "服务通知",
  SYSTEM: "系统通知",
};
