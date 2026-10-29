import { defineStore } from "pinia";
import type { Order } from "@/types/business";
import * as orderApi from "@/api/order";

interface OrderState {
  orderList: Order[];
  loading: boolean;
}

export const useOrderStore = defineStore("order", {
  state: (): OrderState => ({
    orderList: [],
    loading: false,
  }),
  getters: {
    pendingCount: (state) =>
      state.orderList.filter((o) => o.status === "WAIT_VERIFY" || o.status === "WAIT_SHIP").length,
  },
  actions: {
    async fetchOrders(status?: string) {
      this.loading = true;
      try {
        const res = await orderApi.getOrders(status);
        this.orderList = res.data;
      } finally {
        this.loading = false;
      }
    },
    async shipOrder(id: string, company: string, trackingNo: string) {
      await orderApi.shipOrder(id, company, trackingNo);
    },
    async refundApprove(id: string) {
      await orderApi.refundApprove(id);
    },
  },
});
