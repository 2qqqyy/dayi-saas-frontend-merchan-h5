import { defineStore } from "pinia";

interface AppState {
  city: string;
  safeAreaTop: number;
  safeAreaBottom: number;
  loading: boolean;
}

export const useAppStore = defineStore("app", {
  state: (): AppState => ({
    city: "成都 · 青梅里",
    safeAreaTop: 0,
    safeAreaBottom: 0,
    loading: false,
  }),
  actions: {
    setSafeArea(top: number, bottom: number) {
      this.safeAreaTop = top;
      this.safeAreaBottom = bottom;
    },
    setLoading(value: boolean) {
      this.loading = value;
    },
  },
});
