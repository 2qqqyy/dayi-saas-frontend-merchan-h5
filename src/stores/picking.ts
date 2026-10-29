import { defineStore } from "pinia";
import type { PickingSession, PickingStatus } from "@/types/business";
import * as pickingApi from "@/api/picking";
import type { PickingSessionInput } from "@/api/picking";

interface PickingState {
  sessions: PickingSession[];
  loading: boolean;
}

export const usePickingStore = defineStore("picking", {
  state: (): PickingState => ({
    sessions: [],
    loading: false,
  }),
  actions: {
    async fetchSessions(status?: string) {
      this.loading = true;
      try {
        const res = await pickingApi.getPickingSessions(status);
        this.sessions = res.data;
      } finally {
        this.loading = false;
      }
    },
    async createSession(payload: PickingSessionInput) {
      await pickingApi.createPickingSession(payload);
    },
    async updateSession(id: string, payload: PickingSessionInput) {
      await pickingApi.updatePickingSession(id, payload);
    },
    async publishSession(id: string) {
      await pickingApi.publishPickingSession(id);
    },
    async closeSession(id: string) {
      await pickingApi.closePickingSession(id);
    },
    async updateStatus(id: string, status: PickingStatus) {
      await pickingApi.updatePickingStatus(id, status);
    },
    async duplicateSession(id: string) {
      await pickingApi.duplicatePickingSession(id);
    },
  },
});
