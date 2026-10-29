import type { ApiResponse, Room, RoomCalendarDay, RoomStatus } from "@/types/business";
import request from "@/utils/request";
import { mapRoom, mapRoomCalendar, toBackendRoomStatus, toNum } from "@/utils/backend";

export type RoomInput = Omit<Room, "id">;

function adapt(raw: any): Room {
  return mapRoom(raw);
}

/** H5 Room -> 后端 HomestayRoomDTO（需 homestayId） */
async function toDto(payload: Partial<Room>, homestayId?: number) {
  let hid = homestayId ?? toNum((payload as any).homestayId, 0);
  if (!hid) {
    const list: any = await request.get("/homestay/list");
    const owned = Array.isArray(list?.data) ? list.data : [];
    if (owned.length === 0) {
      // 此前兜底为 1，会把房型挂到别家商户的民宿上
      throw new Error("当前账号名下没有民宿，无法新增房型");
    }
    hid = toNum(owned[0].id, 0);
  }
  if (!hid) {
    throw new Error("民宿归属解析失败，请重新登录商家端");
  }
  return {
    homestayId: hid,
    name: payload.name,
    image: payload.image,
    capacity: payload.capacity,
    bedType: payload.bedType,
    breakfast: payload.breakfast,
    price: payload.price,
    stock: payload.stock,
    area: (payload as any).area,
    status: payload.status ? toBackendRoomStatus(payload.status) : 1,
  };
}

export async function getRooms(): Promise<ApiResponse<Room[]>> {
  const res: any = await request.get("/homestay/rooms");
  const list = Array.isArray(res?.data) ? res.data : [];
  return { code: 0, message: "ok", data: list.map(adapt) };
}

export async function getRoom(id: string): Promise<ApiResponse<Room | null>> {
  const res: any = await getRooms();
  const hit = (res.data as Room[]).find((r) => r.id === String(id));
  return { code: 0, message: "ok", data: hit ?? null };
}

export async function createRoom(payload: RoomInput): Promise<ApiResponse<Room>> {
  const res: any = await request.post("/homestay/rooms", await toDto(payload));
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: adapt(res?.data) };
}

export async function updateRoom(
  id: string,
  payload: Partial<Room>,
): Promise<ApiResponse<Room | null>> {
  const res: any = await request.put(`/homestay/rooms/${id}`, await toDto(payload));
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: adapt(res?.data) };
}

export async function updateRoomStatus(
  id: string,
  status: RoomStatus,
): Promise<ApiResponse<Room | null>> {
  const res: any = await request.put(`/homestay/rooms/${id}/status`, null, {
    params: { status: toBackendRoomStatus(status) },
  });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: null };
}

export async function deleteRoom(id: string): Promise<ApiResponse<boolean>> {
  const res: any = await request.delete(`/homestay/rooms/${id}`);
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: res?.code === 0 };
}

export async function getRoomCalendar(
  roomId: string,
): Promise<ApiResponse<RoomCalendarDay[]>> {
  const res: any = await request.get(`/homestay/rooms/${roomId}/calendar`);
  const list = Array.isArray(res?.data) ? res.data : [];
  return { code: 0, message: "ok", data: list.map(mapRoomCalendar) };
}

export async function updateRoomInventory(
  roomId: string,
  date: string,
  patch: { price?: number; stock?: number; status?: RoomStatus },
): Promise<ApiResponse<boolean>> {
  const body = {
    dates: [date],
    status: patch.status ? toBackendRoomStatus(patch.status) : 1,
    price: patch.price,
    stock: patch.stock,
  };
  const res: any = await request.post(`/homestay/rooms/${roomId}/calendar`, body);
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: res?.code === 0 };
}
