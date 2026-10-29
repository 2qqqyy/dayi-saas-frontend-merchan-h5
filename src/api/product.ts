import type { ApiResponse, Product, ProductStatus, Sku } from "@/types/business";
import request from "@/utils/request";
import { mapProduct, toNum } from "@/utils/backend";
import { matchProductCategory, PRODUCT_CATEGORY_IDS } from "@/utils/constants";

export type ProductInput = Omit<Product, "id" | "sales">;

function adapt(raw: any): Product {
  return mapProduct(raw);
}

export async function getProducts(category?: string): Promise<ApiResponse<Product[]>> {
  const params: Record<string, any> = { page: 1, pageSize: 200 };
  const res: any = await request.get("/products", { params });
  const list = res?.data?.list ?? res?.data ?? [];
  const mapped = (Array.isArray(list) ? list : []).map(adapt);
  const filtered =
    category && category !== "all" && category !== "全部"
      ? mapped.filter((p) => matchProductCategory(p.category, category))
      : mapped;
  return { code: 0, message: "ok", data: filtered };
}

export async function getProduct(id: string): Promise<ApiResponse<Product | null>> {
  const res: any = await getProducts();
  const hit = (res.data as Product[]).find((p) => p.id === String(id));
  return { code: 0, message: "ok", data: hit ?? null };
}

/** H5 Product -> 后端 ProductDTO */
function toDto(payload: Partial<Product>) {
  return {
    name: payload.name,
    categoryId: toNum(
      (payload as any).categoryId,
      PRODUCT_CATEGORY_IDS[payload.category ?? ""] ?? 1,
    ),
    coverImage: payload.image,
    images: payload.image,
    summary: payload.summary,
    detail: (payload as any).detail ?? payload.summary,
    price: payload.price,
    origin: payload.origin,
    skus: (payload.skus ?? []).map((s) => ({
      name: s.name,
      price: s.price,
      stock: s.stock,
    })),
  };
}

export async function createProduct(payload: ProductInput): Promise<ApiResponse<Product>> {
  const res: any = await request.post("/products", toDto(payload));
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: adapt(res?.data) };
}

export async function updateProduct(
  id: string,
  payload: Partial<Product>,
): Promise<ApiResponse<Product | null>> {
  const res: any = await request.put(`/products/${id}`, toDto(payload));
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: adapt(res?.data) };
}

/** 上下架：后端 onShelf 1=上架 0=下架 */
export async function updateProductStatus(
  id: string,
  status: ProductStatus,
): Promise<ApiResponse<Product | null>> {
  const onShelf = status === "ON_SALE" ? 1 : 0;
  const res: any = await request.put(`/products/${id}/status`, null, { params: { onShelf } });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: null };
}

export async function deleteProduct(id: string): Promise<ApiResponse<boolean>> {
  // 后端无删除接口，采用下架代替（避免误删）
  const res: any = await request.put(`/products/${id}/status`, null, { params: { onShelf: 0 } });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: res?.code === 0 };
}

/** 库存更新：后端无单 SKU 库存接口，整体提交商品（含 skus） */
export async function updateProductStock(
  id: string,
  skuId: string,
  stock: number,
): Promise<ApiResponse<Product | null>> {
  const cur: any = await getProduct(id);
  const p = cur.data as Product | null;
  if (!p) return { code: 500, message: "商品不存在", data: null };
  const skus = (p.skus ?? []).map((s: Sku) => (s.id === String(skuId) ? { ...s, stock } : s));
  return updateProduct(id, { ...p, skus });
}

export async function updateProductSku(id: string, sku: Sku): Promise<ApiResponse<Product | null>> {
  const cur: any = await getProduct(id);
  const p = cur.data as Product | null;
  if (!p) return { code: 500, message: "商品不存在", data: null };
  const skus = (p.skus ?? []).map((s: Sku) => (s.id === String(sku.id) ? sku : s));
  return updateProduct(id, { ...p, skus });
}

/** 定时上架：到点后端任务自动上架，商品先置为下架 */
export async function scheduleProduct(id: string, onShelfTime: string) {
  const res: any = await request.put(`/products/${id}/schedule`, null, { params: { onShelfTime } });
  return { code: res?.code ?? 0, message: res?.message ?? "ok", data: null };
}
