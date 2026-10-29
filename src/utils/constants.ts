export const APP_NAME = "青梅里商家端";

export const STORAGE_KEYS = {
  token: "merchant-h5-token",
  merchant: "merchant-h5-merchant",
  /** 消息已读标记（api/message.ts 维护，后端暂无已读表） */
  msgRead: "merchant-h5-msg-read",
  /** 通知偏好（本地设置） */
  notifyPref: "merchant-h5-notify-pref",
};

/** 「清除缓存」只清这两个真正会写入的键，登录态不受影响 */
export const CACHE_KEYS = [STORAGE_KEYS.msgRead, STORAGE_KEYS.notifyPref];

export const TAB_PAGES = [
  "pages/index/index",
  "pages/order/index",
  "pages/statistics/index",
  "pages/message/index",
  "pages/user/index",
];

export const ORDER_STATUS_TABS = [
  { label: "全部", value: "all" },
  { label: "待付款", value: "WAIT_PAY" },
  { label: "待使用", value: "WAIT_VERIFY" },
  { label: "待发货", value: "WAIT_SHIP" },
  { label: "待收货", value: "SHIPPING" },
  { label: "已完成", value: "COMPLETED" },
  { label: "退款", value: "REFUNDING" },
  { label: "退款被拒", value: "REFUND_REJECTED" },
] as const;

export const PICKING_STATUS_TABS = [
  { label: "全部", value: "all" },
  { label: "待发布", value: "DRAFT" },
  { label: "已发布", value: "PUBLISHED" },
  { label: "已结束", value: "FINISHED" },
] as const;

/** 与后端 product_category 表一致：一级分类及其下的二级分类 */
export const PRODUCT_CATEGORY_GROUPS: { label: string; children: string[] }[] = [
  { label: "新鲜水果", children: ["青梅", "樱桃", "草莓"] },
  { label: "青梅制品", children: ["青梅酒", "青梅酱", "青梅干"] },
  { label: "农家特产", children: [] },
  { label: "手工艺品", children: [] },
];

export const PRODUCT_CATEGORIES: string[] = PRODUCT_CATEGORY_GROUPS.flatMap((g) => [
  g.label,
  ...g.children,
]);

/** 分类名 -> product_category 表主键，新建/编辑商品时提交给后端 */
export const PRODUCT_CATEGORY_IDS: Record<string, number> = {
  新鲜水果: 1,
  青梅制品: 2,
  农家特产: 3,
  手工艺品: 4,
  青梅: 5,
  樱桃: 6,
  草莓: 7,
  青梅酒: 8,
  青梅酱: 9,
  青梅干: 10,
};

/** product_category 主键 -> 分类名：商家端列表接口只给 categoryId，按名筛选前先还原 */
export const PRODUCT_CATEGORY_NAMES: Record<number, string> = Object.fromEntries(
  Object.entries(PRODUCT_CATEGORY_IDS).map(([name, id]) => [id, name]),
) as Record<number, string>;

/** 商品 category 取自后端分类名，一级/二级都可能是它 */
export function matchProductCategory(category: string, selected: string) {
  if (selected === "全部") return true;
  if (category === selected) return true;
  const group = PRODUCT_CATEGORY_GROUPS.find((g) => g.label === selected);
  return !!group && group.children.includes(category);
}

export const ORDER_STATUS_TEXT: Record<string, string> = {
  WAIT_PAY: "待付款",
  WAIT_VERIFY: "待使用",
  WAIT_SHIP: "待发货",
  SHIPPING: "运输中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
  REFUNDING: "退款中",
  REFUNDED: "已退款",
  REFUND_REJECTED: "退款被拒",
};

export const PICKING_STATUS_TEXT: Record<string, string> = {
  DRAFT: "待发布",
  PUBLISHED: "已发布",
  FULL: "已约满",
  CLOSED: "已关闭",
  FINISHED: "已结束",
};

export const PRODUCT_STATUS_TEXT: Record<string, string> = {
  ON_SALE: "已上架",
  OFF_SALE: "已下架",
};

export const ROOM_STATUS_TEXT: Record<string, string> = {
  OPEN: "营业中",
  CLOSED: "暂停营业",
  MAINTENANCE: "维修中",
  FULL: "已满房",
};

export const MESSAGE_TYPE_TEXT: Record<string, string> = {
  ORDER: "订单通知",
  SYSTEM: "系统通知",
  STOCK: "库存提醒",
  AUDIT: "审核通知",
};
