import type {
  MerchantInfo,
  Order,
  OrderStatus,
  OrderType,
  PickingSession,
  PickingStatus,
  Product,
  ProductStatus,
  Room,
  RoomStatus,
  RoomCalendarDay,
  Sku,
  TrendPoint,
} from "@/types/business";
import { PRODUCT_CATEGORY_NAMES } from "@/utils/constants";

/* ============================================================
 * 后端契约映射层
 * ------------------------------------------------------------
 * 后端（SpringBoot）与商家端 H5 的字段/枚举存在差异，本文件集中
 * 做双向映射，避免各 api 文件重复处理。
 *
 * 后端统一响应：{ code: 200, msg: "请求成功", data: ... }
 * ============================================================ */

export function toNum(v: unknown, def = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export function toStr(v: unknown, def = ""): string {
  return v === null || v === undefined ? def : String(v);
}

export function fmtDate(v: unknown, withTime = true): string {
  if (!v) return "";
  const s = String(v).replace("T", " ");
  return withTime ? s.slice(0, 16) : s.slice(0, 10);
}

export function splitList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string" && v.trim()) return v.split(",").map((s) => s.trim()).filter(Boolean);
  return [];
}

/* ---------------- 商户 ---------------- */

const CERT_MAP: Record<number, MerchantInfo["certStatus"]> = {
  0: "PENDING",
  1: "CERTIFIED",
  2: "CERTIFIED",
  3: "REJECTED",
};

export function mapMerchant(raw: any): MerchantInfo {
  if (!raw) return {} as MerchantInfo;
  const audit = toNum(raw.auditStatus, 0);
  return {
    id: toStr(raw.id),
    name: toStr(raw.name),
    contact: toStr(raw.contact),
    mobile: toStr(raw.mobile),
    city: toStr(raw.city, "成都 · 青梅里"),
    address: toStr(raw.address),
    businessScope: toStr(raw.businessScope),
    openTime: toStr(raw.openTime),
    shopNotice: toStr(raw.shopNotice),
    businessHours: toStr(raw.businessHours, "08:00 - 20:00"),
    intro: toStr(raw.intro ?? raw.summary),
    avatar: toStr(raw.avatar ?? raw.licenseUrl),
    merchantNo: raw.merchantNo ? toStr(raw.merchantNo) : `M${toStr(raw.id).padStart(8, "0")}`,
    certStatus: CERT_MAP[audit] ?? "PENDING",
    // business_status 才是商家自助切换的「营业中/暂停接单」；
    // status 是后台禁用位（登录拦截用），不能拿来显示营业状态
    status: toNum(raw.businessStatus ?? raw.status, 1) === 1 ? "OPEN" : "CLOSED",
    // 保留原始字段，供资料回填使用
    ...({ _raw: raw } as any),
  } as MerchantInfo;
}

/* ---------------- 订单 ---------------- */

const ORDER_TYPE_MAP: Record<number, OrderType> = { 1: "PICKING", 2: "HOMESTAY", 3: "PRODUCT" };

/**
 * 后端订单状态 → 商家端 H5 状态
 * 后端：pending_payment / pending_use / pending_delivery / shipping / completed
 *       / cancelled / refunding / refunded / paid
 */
const ORDER_STATUS_MAP: Record<string, OrderStatus> = {
  pending_payment: "WAIT_PAY",
  wait_pay: "WAIT_PAY",
  paid: "WAIT_VERIFY",
  pending_use: "WAIT_VERIFY",
  pending_delivery: "WAIT_SHIP",
  wait_ship: "WAIT_SHIP",
  shipping: "SHIPPING",
  shipped: "SHIPPING",
  completed: "COMPLETED",
  finished: "COMPLETED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
  closed: "CANCELLED",
  refunding: "REFUNDING",
  refunded: "REFUNDED",
  refund_rejected: "REFUND_REJECTED",
};

export function mapOrderStatus(s: unknown): OrderStatus {
  return ORDER_STATUS_MAP[String(s ?? "").toLowerCase()] ?? "WAIT_VERIFY";
}

/** 商家端 H5 状态 → 后端状态（用于查询过滤 / 回写） */
const REVERSE_ORDER_STATUS: Record<string, string> = {
  WAIT_PAY: "pending_payment",
  WAIT_VERIFY: "pending_use",
  WAIT_SHIP: "pending_delivery",
  SHIPPING: "shipping",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDING: "refunding",
  REFUNDED: "refunded",
  REFUND_REJECTED: "refund_rejected",
};

export function toBackendOrderStatus(s: string): string {
  return REVERSE_ORDER_STATUS[s] ?? s;
}

export function mapOrder(raw: any): Order {
  if (!raw) return {} as Order;
  const type = ORDER_TYPE_MAP[toNum(raw.type, 1)] ?? "PICKING";
  // 后端详情接口把 items/addressSnapshot 等扩展字段平铺在订单对象上
  const extra = raw._extra ?? raw;
  return {
    id: toStr(raw.id),
    merchantId: toStr(raw.merchantId),
    orderNo: toStr(raw.orderNo),
    type,
    status: mapOrderStatus(raw.status),
    customerName: toStr(raw.customerName ?? extra.contactName ?? extra.guestName ?? extra.receiver),
    customerMobile: toStr(raw.customerMobile ?? extra.contactMobile ?? extra.guestMobile),
    amount: toNum(raw.payAmount ?? raw.amount ?? extra.amount),
    createdAt: fmtDate(raw.createTime),
    subtitle: raw.subtitle ? toStr(raw.subtitle) : undefined,
    title: raw.title ? toStr(raw.title) : undefined,
    // 采摘
    orchardName: toStr(raw.orchardName ?? raw.title),
    sessionDate: raw.pickDate ? fmtDate(raw.pickDate, false) : undefined,
    sessionTime: raw.sessionTime ? toStr(raw.sessionTime) : undefined,
    people: raw.peopleNum != null ? toNum(raw.peopleNum) : undefined,
    verifyCode: raw.verifyCode ? toStr(raw.verifyCode) : undefined,
    verifiedAt: raw.verifyTime ? fmtDate(raw.verifyTime) : undefined,
    // 民宿
    roomName: toStr(raw.roomName ?? raw.title),
    checkIn: raw.checkIn ? fmtDate(raw.checkIn, false) : undefined,
    checkOut: raw.checkOut ? fmtDate(raw.checkOut, false) : undefined,
    nights: raw.nights != null ? toNum(raw.nights) : undefined,
    // 商品：后端 order_item 字段为 productName/unitPrice，需归一化
    items: Array.isArray(extra.items)
      ? extra.items.map((it: any) => ({
          name: toStr(it.name ?? it.productName),
          skuName: toStr(it.skuName),
          price: toNum(it.price ?? it.unitPrice),
          quantity: toNum(it.quantity),
        }))
      : undefined,
    receiver: toStr(extra.receiver),
    address: toStr(extra.addressSnapshot ?? extra.address),
    shipping:
      raw.logisticsCompany || raw.logisticsNo
        ? { company: toStr(raw.logisticsCompany), trackingNo: toStr(raw.logisticsNo) }
        : undefined,
  };
}

/* ---------------- 采摘档期 ---------------- */

const PICKING_STATUS_MAP: Record<number, PickingStatus> = {
  0: "DRAFT",
  1: "PUBLISHED",
  2: "FINISHED",
};

export function mapPickingSession(raw: any): PickingSession {
  if (!raw) return {} as PickingSession;
  const max = toNum(raw.maxPeople ?? raw.capacity);
  // 后端字段为 bookedCount / slotDate / orchardId，此前按 booked / date 取值导致列表日期与已约数恒空
  const booked = toNum(raw.booked ?? raw.bookedNum ?? raw.bookedCount);
  let status = PICKING_STATUS_MAP[toNum(raw.status, 0)] ?? "DRAFT";
  if (status === "PUBLISHED" && max > 0 && booked >= max) status = "FULL";
  const slotDate = raw.slotDate ?? raw.date ?? raw.startDate;
  return {
    id: toStr(raw.id),
    merchantId: toStr(raw.merchantId),
    orchardId: raw.orchardId !== undefined && raw.orchardId !== null ? toStr(raw.orchardId) : undefined,
    orchardName: toStr(raw.orchardName ?? raw.orchard ?? raw.title),
    date: slotDate ? fmtDate(slotDate, false) : "",
    startTime: toStr(raw.startTime),
    endTime: toStr(raw.endTime),
    adultPrice: toNum(raw.adultPrice ?? raw.price),
    maxPeople: max,
    booked,
    status,
  };
}

/** H5 DRAFT → 后端 0；PUBLISHED/FULL → 1；FINISHED/CLOSED → 2 */
export function toBackendPickingStatus(s: PickingStatus): number {
  if (s === "PUBLISHED" || s === "FULL") return 1;
  if (s === "FINISHED" || s === "CLOSED") return 2;
  return 0;
}

/* ---------------- 商品 ---------------- */

export function mapSku(raw: any): Sku {
  return {
    id: toStr(raw.id),
    name: toStr(raw.name ?? raw.specName),
    price: toNum(raw.price),
    stock: toNum(raw.stock),
    skuCode: toStr(raw.skuCode ?? raw.code),
  };
}

export function mapProduct(raw: any): Product {
  if (!raw) return {} as Product;
  // 后端可能返回 { product, skus } 结构
  const p = raw.product ?? raw;
  const skus: Sku[] = Array.isArray(raw.skus)
    ? (raw.skus as unknown[]).map((s) => mapSku(s))
    : [];
  return {
    id: toStr(p.id),
    merchantId: toStr(p.merchantId),
    name: toStr(p.name),
    image: toStr(p.coverImage ?? p.image),
    category: toStr(p.categoryName ?? p.category) || PRODUCT_CATEGORY_NAMES[toNum(p.categoryId)] || "",
    summary: toStr(p.summary),
    price: toNum(p.price),
    stock: skus.length ? skus.reduce((s: number, k: Sku) => s + k.stock, 0) : toNum(p.stock),
    sales: toNum(p.sales),
    weight: toStr(p.weight),
    origin: toStr(p.origin),
    freight: toNum(p.freight),
    status: toNum(p.onShelf, 0) === 1 ? "ON_SALE" : "OFF_SALE",
    auditStatus: p.auditStatus == null ? undefined : toNum(p.auditStatus),
    auditRemark: toStr(p.auditRemark),
    skus,
  };
}

/* ---------------- 民宿房型 ---------------- */

const ROOM_STATUS_MAP: Record<number, RoomStatus> = { 0: "CLOSED", 1: "OPEN", 2: "MAINTENANCE" };

export function mapRoom(raw: any): Room {
  if (!raw) return {} as Room;
  return {
    id: toStr(raw.id),
    merchantId: toStr(raw.merchantId),
    name: toStr(raw.name),
    image: toStr(raw.coverImage ?? raw.image),
    price: toNum(raw.price),
    capacity: toNum(raw.capacity ?? raw.maxGuests),
    bedType: toStr(raw.bedType),
    breakfast: toStr(raw.breakfast),
    facilities: splitList(raw.facilities),
    description: toStr(raw.description ?? raw.intro),
    stock: toNum(raw.stock ?? raw.totalRooms),
    status: ROOM_STATUS_MAP[toNum(raw.status, 1)] ?? "OPEN",
  };
}

export function toBackendRoomStatus(s: RoomStatus): number {
  if (s === "OPEN") return 1;
  if (s === "MAINTENANCE") return 2;
  return 0;
}

export function mapRoomCalendar(raw: any): RoomCalendarDay {
  return {
    date: fmtDate(raw.date, false),
    stock: toNum(raw.stock ?? raw.available),
    price: toNum(raw.price),
    booked: toNum(raw.booked),
    status: ROOM_STATUS_MAP[toNum(raw.status, 1)] ?? "OPEN",
  };
}

/* ---------------- 统计趋势 ---------------- */

export function mapTrend(list: any[]): TrendPoint[] {
  if (!Array.isArray(list)) return [];
  return list.map((it) => ({
    date: toStr(it.date ?? it.label ?? it.day).slice(5),
    value: toNum(it.value ?? it.amount ?? it.count),
  }));
}
