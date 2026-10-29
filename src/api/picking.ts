import type { ApiResponse, PickingSession, PickingStatus } from "@/types/business";
import request from "@/utils/request";
import { mapPickingSession, toBackendPickingStatus } from "@/utils/backend";

export type PickingSessionInput = Omit<PickingSession, "id" | "status" | "booked">;

/** 当前商户名下的采摘园（后端 GET /api/merchant/orchards） */
export interface MyOrchard {
  id: string;
  name: string;
}

let orchardNameCache: Record<string, string> | null = null;

/** 档期列表按 orchardId 关联，后端不返回名称，这里用商户自己的果园列表补全 */
async function orchardNames(): Promise<Record<string, string>> {
  if (orchardNameCache) return orchardNameCache;
  const res: any = await request.get("/orchards");
  const map: Record<string, string> = {};
  (Array.isArray(res?.data) ? res.data : []).forEach((o: any) => {
    map[String(o.id)] = String(o.name ?? "");
  });
  orchardNameCache = map;
  return map;
}

export async function getMyOrchards(): Promise<ApiResponse<MyOrchard[]>> {
  const res: any = await request.get("/orchards");
  const list = (Array.isArray(res?.data) ? res.data : []).map((o: any) => ({
    id: String(o.id),
    name: String(o.name ?? ""),
  }));
  orchardNameCache = null;
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: list };
}

/** 后端 PickingSession -> H5（补全 orchardName / 拆分时间区间） */
async function adapt(raw: any): Promise<PickingSession> {
  const s = mapPickingSession(raw);
  // timeRange "09:00-11:00" -> startTime / endTime
  if (!s.startTime && raw?.timeRange) {
    const [a, b] = String(raw.timeRange).split("-");
    s.startTime = (a ?? "").trim();
    s.endTime = (b ?? "").trim();
  }
  if (!s.orchardName && s.orchardId) {
    s.orchardName = (await orchardNames())[s.orchardId] ?? "";
  }
  return s;
}

export async function getPickingSessions(status?: string): Promise<ApiResponse<PickingSession[]>> {
  const params: Record<string, any> = {};
  if (status && status !== "all") params.status = toBackendPickingStatus(status as PickingStatus);
  const res: any = await request.get("/picking/sessions", { params });
  const list = Array.isArray(res?.data) ? res.data : res?.data?.list ?? [];
  return { code: 0, message: "ok", data: await Promise.all(list.map(adapt)) };
}

export async function getPickingSession(id: string): Promise<ApiResponse<PickingSession | null>> {
  const res: any = await request.get("/picking/sessions", { params: { page: 1, pageSize: 200 } });
  const list = Array.isArray(res?.data) ? res.data : res?.data?.list ?? [];
  const hit = list.find((s: any) => String(s.id) === String(id));
  return { code: 0, message: "ok", data: hit ? await adapt(hit) : null };
}

/** 后端 DTO：orchardId / slotDate / timeRange / maxPeople / price */
function toDto(payload: PickingSessionInput, raw?: any) {
  const orchardId = Number((payload as any).orchardId ?? raw?.orchardId ?? 0);
  if (!orchardId) {
    throw new Error("请先选择采摘园");
  }
  return {
    orchardId,
    slotDate: payload.date,
    timeRange: `${payload.startTime || "09:00"}-${payload.endTime || "12:00"}`,
    maxPeople: payload.maxPeople,
    price: payload.adultPrice,
  };
}

/** publish=false 时以 status=0 落草稿，C 端不可见；true 时 status=1 直接发布 */
export async function createPickingSession(
  payload: PickingSessionInput,
  publish = true,
): Promise<ApiResponse<PickingSession>> {
  const res: any = await request.post("/picking/sessions", {
    ...toDto(payload),
    status: publish ? 1 : 0,
  });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: await adapt(res?.data) };
}

export async function updatePickingSession(
  id: string,
  payload: PickingSessionInput,
): Promise<ApiResponse<PickingSession | null>> {
  const res: any = await request.put(`/picking/sessions/${id}`, toDto(payload));
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: await adapt(res?.data) };
}

export async function updatePickingStatus(
  id: string,
  status: PickingStatus,
): Promise<ApiResponse<PickingSession | null>> {
  const res: any = await request.put(`/picking/sessions/${id}/status`, null, {
    params: { status: toBackendPickingStatus(status) },
  });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: null };
}

/** 发布：后端 status 1=已发布 */
export function publishPickingSession(id: string): Promise<ApiResponse<PickingSession | null>> {
  return updatePickingStatus(id, "PUBLISHED");
}

/** 关闭：后端 status 2=已结束 */
export function closePickingSession(id: string): Promise<ApiResponse<PickingSession | null>> {
  return updatePickingStatus(id, "CLOSED");
}

/** 复制档期：读取原档期后以草稿（status=0）新建，等商家确认后再发布 */
export async function duplicatePickingSession(
  id: string,
): Promise<ApiResponse<PickingSession>> {
  const src = await getPickingSession(id);
  const s = src.data;
  if (!s?.orchardId) {
    throw new Error("原档期未关联采摘园，无法复制");
  }
  const res: any = await request.post("/picking/sessions", {
    orchardId: Number(s.orchardId),
    slotDate: s.date,
    timeRange: `${s.startTime || "09:00"}-${s.endTime || "12:00"}`,
    maxPeople: s.maxPeople,
    price: s.adultPrice,
    status: 0,
  });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: await adapt(res?.data) };
}

export async function deletePickingSession(id: string): Promise<ApiResponse<boolean>> {
  const res: any = await request.delete(`/picking/sessions/${id}`);
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: res?.code === 0 };
}
