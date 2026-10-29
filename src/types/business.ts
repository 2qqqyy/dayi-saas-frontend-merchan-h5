export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/* ===== 商家 ===== */
export type MerchantStatus = "OPEN" | "CLOSED";
export type CertStatus = "CERTIFIED" | "PENDING" | "REJECTED";

export interface MerchantInfo {
  id: string; // merchantId
  name: string;
  contact: string;
  mobile: string;
  city: string;
  address: string;
  businessScope: string;
  businessHours: string;
  intro: string;
  avatar: string;
  merchantNo: string;
  certStatus: CertStatus;
  status: MerchantStatus;
  /** 营业时间，如 08:00-20:00 */
  openTime?: string;
  /** 店铺公告（展示给游客） */
  shopNotice?: string;
}

export interface LoginResult {
  token: string;
  merchantId: string;
  merchantInfo: MerchantInfo;
}

/* ===== 首页工作台 ===== */
export interface TodoItem {
  key: string;
  label: string;
  count: number;
  path: string;
}

export interface TrendPoint {
  date: string;
  value: number;
}

export interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  waitVerify: number;
  waitShip: number;
  todos: TodoItem[];
  todayOrderList: Order[];
  trend: TrendPoint[];
}

/* ===== 采摘场次 ===== */
export type PickingStatus = "DRAFT" | "PUBLISHED" | "FULL" | "CLOSED" | "FINISHED";

export interface PickingSession {
  id: string;
  merchantId: string;
  /** 后端 orchardId；创建/复制档期时必须带上真实果园，不再前端兜底为 1 */
  orchardId?: string;
  orchardName: string;
  date: string;
  startTime: string;
  endTime: string;
  /** 后端 picking_session 只有单一 price 列，无儿童价与场次须知，故不再提供这两个字段 */
  adultPrice: number;
  maxPeople: number;
  booked: number;
  status: PickingStatus;
}

/* ===== 民宿房间 ===== */
export type RoomStatus = "OPEN" | "CLOSED" | "MAINTENANCE" | "FULL";

export interface Room {
  id: string;
  merchantId: string;
  name: string;
  image: string;
  price: number;
  capacity: number;
  bedType: string;
  breakfast: string;
  facilities: string[];
  description: string;
  stock: number;
  status: RoomStatus;
}

export interface RoomCalendarDay {
  date: string;
  stock: number;
  price: number;
  booked: number;
  status: RoomStatus;
}

/* ===== 商品 ===== */
export type ProductStatus = "ON_SALE" | "OFF_SALE";

export interface Sku {
  id: string;
  name: string;
  price: number;
  stock: number;
  skuCode: string;
}

export interface Product {
  id: string;
  merchantId: string;
  name: string;
  image: string;
  category: string;
  summary: string;
  price: number;
  stock: number;
  sales: number;
  weight: string;
  origin: string;
  freight: number;
  status: ProductStatus;
  /** 平台审核：0待审 1通过 2驳回 */
  auditStatus?: number;
  auditRemark?: string;
  skus: Sku[];
}

/* ===== 订单 ===== */
export type OrderType = "PICKING" | "HOMESTAY" | "PRODUCT";
export type OrderStatus =
  | "WAIT_PAY"
  | "WAIT_VERIFY"
  | "WAIT_SHIP"
  | "SHIPPING"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDING"
  | "REFUNDED"
  | "REFUND_REJECTED";

export interface OrderItemLine {
  name: string;
  skuName: string;
  price: number;
  quantity: number;
}

export interface ShippingInfo {
  company: string;
  trackingNo: string;
}

export interface Order {
  id: string;
  merchantId: string;
  orderNo: string;
  type: OrderType;
  status: OrderStatus;
  customerName: string;
  customerMobile: string;
  amount: number;
  createdAt: string;
  // 后端下发的摘要文案（如采摘场次 "2026-09-22 09:00-12:00"），细分字段缺失时兜底
  subtitle?: string;
  // 订单主标题（商品名 / 果园名 / 房型名）
  title?: string;
  // 采摘
  orchardName?: string;
  sessionDate?: string;
  sessionTime?: string;
  people?: number;
  verifyCode?: string;
  verifiedAt?: string;
  // 民宿
  roomName?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number;
  // 商品
  items?: OrderItemLine[];
  receiver?: string;
  address?: string;
  shipping?: ShippingInfo;
}

export interface VerifyResult {
  success: boolean;
  reason?: string;
  order?: Order;
}

/* ===== 经营统计 ===== */
export interface CategoryIncome {
  name: string;
  value: number;
}

export interface StatisticsData {
  revenue: number;
  orderCount: number;
  verifyCount: number;
  waitVerify: number;
  refundAmount: number;
  revenueTrend: TrendPoint[];
  categoryIncome: CategoryIncome[];
}

/* ===== 结算 / 提现 ===== */

/** 结算状态：PENDING=待结算(0) SETTLED=已结算(1) */
export type SettlementStatus = "PENDING" | "SETTLED";

export interface SettlementItem {
  id: string;
  /** 关联订单 id */
  orderId: string;
  /** 关联订单号（后端 settlement 表若未冗余则回退展示 orderId） */
  orderNo: string;
  /** 订单金额 */
  orderAmount: number;
  /** 平台佣金比例（如 0.05） */
  commissionRate: number;
  /** 平台佣金金额 */
  commissionAmount: number;
  /** 商户实际结算金额 = 订单金额 - 佣金 */
  settleAmount: number;
  status: SettlementStatus;
  createdAt: string;
}

/** 提现状态：PROCESSING=处理中(0) SUCCESS=已到账(1) REJECTED=已驳回(2) */
export type WithdrawalStatus = "PROCESSING" | "SUCCESS" | "REJECTED";

export interface WithdrawalItem {
  id: string;
  amount: number;
  bankName: string;
  accountName: string;
  /** 银行卡号（展示时需做脱敏） */
  accountNo: string;
  status: WithdrawalStatus;
  /** 预计/实际到账日期 */
  arrivalDate: string;
  remark: string;
  createdAt: string;
}

/* ===== 消息 ===== */
export type MessageType = "ORDER" | "SYSTEM" | "STOCK" | "AUDIT";

export interface MessageItem {
  id: string;
  merchantId: string;
  type: MessageType;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  time: string;
  read: boolean;
  orderId?: string;
}
