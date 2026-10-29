import { defineStore } from "pinia";
import type { MerchantInfo, MerchantStatus } from "@/types/business";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage, setStorage, removeStorage } from "@/utils/storage";
import * as authApi from "@/api/auth";
import * as merchantApi from "@/api/merchant";

interface MerchantState {
  token: string;
  merchantInfo: MerchantInfo | null;
  loading: boolean;
}

export const useMerchantStore = defineStore("merchant", {
  state: (): MerchantState => ({
    token: getStorage<string>(STORAGE_KEYS.token, ""),
    merchantInfo: getStorage<MerchantInfo | null>(STORAGE_KEYS.merchant, null),
    loading: false,
  }),
  getters: {
    isLogin: (state) => Boolean(state.token),
    merchantId: (state) => state.merchantInfo?.id ?? "",
  },
  actions: {
    async login(mobile: string, code: string, method: "password" | "sms") {
      const res = await authApi.login({ mobile, code, method });
      this.token = res.data.token;
      this.merchantInfo = res.data.merchantInfo;
      setStorage(STORAGE_KEYS.token, this.token);
      setStorage(STORAGE_KEYS.merchant, this.merchantInfo);
    },
    async logout() {
      // 通知后端清理登录上下文（JWT 无状态，失败也不阻塞本地登出）
      try {
        await authApi.logout();
      } catch {
        /* ignore */
      }
      this.token = "";
      this.merchantInfo = null;
      removeStorage(STORAGE_KEYS.token);
      removeStorage(STORAGE_KEYS.merchant);
    },
    async fetchMerchantInfo() {
      const res = await merchantApi.getMerchantInfo();
      this.merchantInfo = res.data;
      setStorage(STORAGE_KEYS.merchant, this.merchantInfo);
    },
    /** 返回是否写库成功，失败时保留原始资料，页面据此提示并退出编辑 */
    async updateMerchant(payload: Partial<MerchantInfo>): Promise<boolean> {
      const res = await merchantApi.updateMerchantInfo(payload);
      if (res.code !== 0 || !res.data) return false;
      this.merchantInfo = res.data;
      setStorage(STORAGE_KEYS.merchant, this.merchantInfo);
      return true;
    },
    /** 返回是否写库成功，失败时不改动本地状态，页面据此回滚开关 */
    async updateStatus(status: MerchantStatus): Promise<boolean> {
      const res = await merchantApi.updateMerchantStatus(status);
      if (res.code !== 0 || !res.data) return false;
      this.merchantInfo = res.data;
      setStorage(STORAGE_KEYS.merchant, this.merchantInfo);
      return true;
    },
  },
});
