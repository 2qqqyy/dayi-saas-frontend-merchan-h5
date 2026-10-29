import { defineStore } from "pinia";
import type { Product, ProductStatus, Sku } from "@/types/business";
import * as productApi from "@/api/product";
import type { ProductInput } from "@/api/product";

interface ProductState {
  products: Product[];
  loading: boolean;
}

export const useProductStore = defineStore("product", {
  state: (): ProductState => ({
    products: [],
    loading: false,
  }),
  actions: {
    async fetchProducts(category?: string) {
      this.loading = true;
      try {
        const res = await productApi.getProducts(category);
        this.products = res.data;
      } finally {
        this.loading = false;
      }
    },
    async createProduct(payload: ProductInput) {
      await productApi.createProduct(payload);
    },
    async updateProduct(id: string, payload: Partial<Product>) {
      await productApi.updateProduct(id, payload);
    },
    async updateStatus(id: string, status: ProductStatus) {
      await productApi.updateProductStatus(id, status);
    },
    async updateStock(id: string, skuId: string, stock: number) {
      await productApi.updateProductStock(id, skuId, stock);
    },
    async updateSku(id: string, sku: Sku) {
      await productApi.updateProductSku(id, sku);
    },
    async deleteProduct(id: string) {
      await productApi.deleteProduct(id);
    },
  },
});
