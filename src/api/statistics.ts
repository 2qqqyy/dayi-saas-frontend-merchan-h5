import type {
  ApiResponse,
  CategoryIncome,
  DashboardData,
  StatisticsData,
  TrendPoint,
} from "@/types/business";
import request from "@/utils/request";
import { mapOrder, toNum } from "@/utils/backend";

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function trend(list: any): TrendPoint[] {
  if (!Array.isArray(list)) return [];
  return list.map((it) => ({ date: String(it.date ?? ""), value: num(it.value) }));
}

export async function getStatistics(range: string): Promise<ApiResponse<StatisticsData>> {
  const res: any = await request.get("/statistics/summary", { params: { range } });
  const d = res?.data ?? {};
  const categoryIncome: CategoryIncome[] = Array.isArray(d.categoryIncome)
    ? d.categoryIncome.map((c: any) => ({ name: String(c.name ?? ""), value: num(c.value) }))
    : [];
  return {
    code: 0,
    message: "ok",
    data: {
      revenue: num(d.revenue),
      orderCount: num(d.orderCount),
      verifyCount: num(d.verifyCount),
      waitVerify: num(d.waitVerify),
      refundAmount: num(d.refundAmount),
      revenueTrend: trend(d.revenueTrend),
      categoryIncome,
    },
  };
}

export async function getDashboard(): Promise<ApiResponse<DashboardData>> {
  const res: any = await request.get("/statistics/dashboard");
  const d = res?.data ?? {};
  return {
    code: 0,
    message: "ok",
    data: {
      todayRevenue: num(d.todayRevenue),
      todayOrders: num(d.todayOrders),
      waitVerify: num(d.waitVerify),
      waitShip: num(d.waitShip),
      todos: Array.isArray(d.todos) ? d.todos : [],
      todayOrderList: Array.isArray(d.todayOrderList) ? d.todayOrderList.map(mapOrder) : [],
      trend: trend(d.trend),
    },
  };
}
