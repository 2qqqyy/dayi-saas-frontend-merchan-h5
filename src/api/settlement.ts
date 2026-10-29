import type { ApiResponse, SettlementItem, WithdrawalItem } from "@/types/business";
import request from "@/utils/request";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

/** 结算状态：0=待结算 1=已结算 */
function mapSettlementStatus(s: unknown): SettlementItem["status"] {
  return num(s) === 1 ? "SETTLED" : "PENDING";
}

/** 提现状态：0=处理中 1=已到账 2=已驳回 */
function mapWithdrawalStatus(s: unknown): WithdrawalItem["status"] {
  const n = num(s);
  if (n === 1) return "SUCCESS";
  if (n === 2) return "REJECTED";
  return "PROCESSING";
}

function mapSettlement(raw: any): SettlementItem {
  return {
    id: str(raw?.id),
    orderId: str(raw?.orderId),
    orderNo: str(raw?.orderNo),
    orderAmount: num(raw?.orderAmount),
    commissionRate: num(raw?.commissionRate),
    commissionAmount: num(raw?.commissionAmount),
    settleAmount: num(raw?.settleAmount),
    status: mapSettlementStatus(raw?.status),
    createdAt: str(raw?.createTime ?? raw?.createdAt),
  };
}

function mapWithdrawal(raw: any): WithdrawalItem {
  return {
    id: str(raw?.id),
    amount: num(raw?.amount),
    bankName: str(raw?.bankName),
    accountName: str(raw?.accountName),
    accountNo: str(raw?.accountNo),
    status: mapWithdrawalStatus(raw?.status),
    arrivalDate: str(raw?.arrivalDate),
    remark: str(raw?.remark),
    createdAt: str(raw?.createTime ?? raw?.createdAt),
  };
}

/** 结算列表（后端 GET /api/merchant/settlements 分页） */
export async function getSettlements(
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<{ list: SettlementItem[]; total: number }>> {
  const res: any = await request.get("/settlements", { params: { page, pageSize } });
  const d = res?.data ?? {};
  const list = Array.isArray(d.list) ? d.list.map(mapSettlement) : [];
  return { code: 0, message: "ok", data: { list, total: num(d.total) } };
}

/** 提现记录（后端 GET /api/merchant/withdrawals 分页） */
export async function getWithdrawals(
  page = 1,
  pageSize = 20,
): Promise<ApiResponse<{ list: WithdrawalItem[]; total: number }>> {
  const res: any = await request.get("/withdrawals", { params: { page, pageSize } });
  const d = res?.data ?? {};
  const list = Array.isArray(d.list) ? d.list.map(mapWithdrawal) : [];
  return { code: 0, message: "ok", data: { list, total: num(d.total) } };
}

/** 申请提现（后端 POST /api/merchant/withdrawals?amount=，query 传参） */
export async function applyWithdrawal(amount: number): Promise<ApiResponse<WithdrawalItem>> {
  const res: any = await request.post("/withdrawals", null, { params: { amount } });
  return {
    code: res?.code ?? 0,
    message: res?.message ?? "ok",
    data: mapWithdrawal(res?.data),
  };
}

/**
 * 结算口径概览（后端 GET /api/merchant/statistics/overview）
 * 后端 SettlementServiceImpl#statisticsOverview 实际返回：
 *   { pendingAmount 待结算, withdrawnAmount 已提现到账, totalSales 总销售额 }
 */
export interface SettlementOverview {
  /** 待结算（可提现）金额：settlement.status = 0 的 settleAmount 之和 */
  pendingAmount: number;
  /** 已提现金额：withdrawal.status = 1 的 amount 之和 */
  withdrawnAmount: number;
  /** 总销售额：全部 settlement.orderAmount 之和 */
  totalSales: number;
}

export async function getSettlementOverview(): Promise<ApiResponse<SettlementOverview>> {
  const res: any = await request.get("/statistics/overview");
  const d = res?.data ?? {};
  return {
    code: 0,
    message: "ok",
    data: {
      pendingAmount: num(d.pendingAmount),
      withdrawnAmount: num(d.withdrawnAmount),
      totalSales: num(d.totalSales),
    },
  };
}

/* ===== 结算 / 提现 展示用辅助 ===== */

/** 收款账户（来自后端 GET /api/merchant/me 的 merchant 实体） */
export interface PayeeAccount {
  bankName: string;
  accountName: string;
  accountNo: string;
}

/**
 * 拉取当前商户收款账户信息（提现页回显）
 * 后端 GET /api/merchant/me 返回完整 Merchant 实体，含 bankName/accountName/accountNo
 */
export async function getPayeeAccount(): Promise<ApiResponse<PayeeAccount>> {
  const res: any = await request.get("/me");
  const d = res?.data ?? {};
  return {
    code: 0,
    message: "ok",
    data: {
      bankName: str(d.bankName),
      accountName: str(d.accountName),
      accountNo: str(d.accountNo),
    },
  };
}

/** 银行卡号脱敏：6217 **** **** 1234 */
export function maskBankCard(no: string): string {
  const s = str(no).replace(/\s/g, "");
  if (!s) return "";
  if (s.length <= 8) return s;
  return `${s.slice(0, 4)} **** **** ${s.slice(-4)}`;
}

export const SETTLEMENT_STATUS_LABEL: Record<SettlementItem["status"], string> = {
  PENDING: "待结算",
  SETTLED: "已结算",
};

export const WITHDRAWAL_STATUS_LABEL: Record<WithdrawalItem["status"], string> = {
  PROCESSING: "处理中",
  SUCCESS: "已到账",
  REJECTED: "已驳回",
};

/** 提现状态 -> 主题色（用于标签底色） */
export function withdrawalStatusTone(s: WithdrawalItem["status"]): "warn" | "ok" | "danger" {
  if (s === "SUCCESS") return "ok";
  if (s === "REJECTED") return "danger";
  return "warn";
}

/** 格式化金额：1234.5 -> "1234.50" */
export function money(v: number | string | null | undefined): string {
  return num(v).toFixed(2);
}

/** 仅保留日期部分：2026-09-22T10:30:00 -> 2026-09-22 */
export function dateOnly(v: string | null | undefined): string {
  const s = str(v);
  return s ? s.slice(0, 10) : "-";
}
