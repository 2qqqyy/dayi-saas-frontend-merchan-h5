<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import LoadingState from "@/components/LoadingState.vue";
import {
  getTicketDetail,
  replyTicket,
  updateTicketStatus,
  TICKET_CATEGORY,
  TICKET_STATUS,
  type MTicket,
  type MTicketMessage,
} from "@/api/ticket";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

const qmClass = useQmClass();
const id = ref("");
const loading = ref(true);
const ticket = ref<MTicket | null>(null);
const messages = ref<MTicketMessage[]>([]);
const userName = ref("");
const text = ref("");
const sending = ref(false);

const canReply = computed(() => !!ticket.value && ticket.value.status !== 3);

async function load() {
  loading.value = true;
  try {
    const res = await getTicketDetail(id.value);
    if (!res.data) {
      uni.showToast({ title: res.message || tr("加载失败"), icon: "none" });
      return;
    }
    ticket.value = res.data.ticket;
    messages.value = res.data.messages ?? [];
    userName.value = res.data.userName || "";
  } catch {
    uni.showToast({ title: tr("加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
}

async function onSend() {
  if (!text.value.trim() || sending.value) return;
  sending.value = true;
  try {
    const res = await replyTicket(id.value, text.value.trim());
    if (!res.data) {
      uni.showToast({ title: res.message || tr("发送失败"), icon: "none" });
      return;
    }
    text.value = "";
    load();
  } catch {
    uni.showToast({ title: tr("发送失败"), icon: "none" });
  } finally {
    sending.value = false;
  }
}

async function onResolve() {
  const res = await updateTicketStatus(id.value, 2);
  if (!res.data) {
    uni.showToast({ title: res.message || tr("操作失败"), icon: "none" });
    return;
  }
  uni.showToast({ title: tr("已结案"), icon: "success" });
  load();
}

onLoad(async (options) => {
  id.value = (options?.id as string) || "";
  if (id.value) await load();
});
</script>

<template>
  <view class="td" :class="qmClass">
    <MerchantNavbar :title="tr('工单详情')" show-back show-home />

    <LoadingState v-if="loading" :rows="4" />

    <template v-else-if="ticket">
      <view class="td__head card">
        <view class="td__row">
          <text class="td__title">{{ ticket.title }}</text>
          <text class="td__status">{{ tr(TICKET_STATUS[ticket.status]) }}</text>
        </view>
        <text class="td__meta">
          {{ ticket.ticketNo }} · {{ userName }} · {{ tr(TICKET_CATEGORY[ticket.category] || "其他咨询") }}
        </text>
        <view v-if="ticket.status !== 3" class="td__ops">
          <view class="td__resolve" @tap="onResolve">{{ tr("标记已解决") }}</view>
        </view>
      </view>

      <view class="td__messages">
        <view
          v-for="m in messages"
          :key="m.id"
          class="td__msg"
          :class="{ 'td__msg--mine': m.senderType !== 'USER' }"
        >
          <text class="td__sender">{{ m.senderType === "USER" ? userName || tr("游客") : m.senderName }}</text>
          <view class="td__bubble" :class="{ 'td__bubble--mine': m.senderType !== 'USER' }">
            <text>{{ m.content }}</text>
          </view>
          <text class="td__time">{{ (m.createTime || "").slice(5, 16).replace("T", " ") }}</text>
        </view>
      </view>

      <view v-if="canReply" class="td__composer">
        <textarea v-model="text" class="td__input" :maxlength="500" :placeholder="tr('回复游客…')" />
        <view class="td__send" @tap="onSend">{{ sending ? tr("发送中…") : tr("发送") }}</view>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.td {
  min-height: 100vh;
  padding-bottom: 200rpx;
  background: $bg;
}

.td__head {
  margin: 24rpx;
  padding: 24rpx;
}

.td__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.td__title {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
}

.td__status {
  flex-shrink: 0;
  font-size: 21rpx;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  background: $green-bg;
  color: $green;
}

.td__meta {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: $text-mute;
}

.td__ops {
  margin-top: 16rpx;
  display: flex;
  justify-content: flex-end;
}

.td__resolve {
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  border: 1rpx solid $line-strong;
  font-size: 23rpx;
  color: $text-sub;
}

.td__messages {
  padding: 0 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.td__msg {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6rpx;
}

.td__msg--mine {
  align-items: flex-end;
}

.td__sender {
  font-size: 21rpx;
  color: $text-mute;
}

.td__bubble {
  max-width: 78%;
  padding: 16rpx 20rpx;
  border-radius: 20rpx 20rpx 20rpx 4rpx;
  background: $surface;
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.6;
}

.td__bubble--mine {
  background: $green;
  color: #f7f3e6;
  border-radius: 20rpx 20rpx 4rpx 20rpx;
}

.td__time {
  font-size: 20rpx;
  color: $text-mute;
}

.td__composer {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: $surface;
  border-top: 1rpx solid $line-2;
}

.td__input {
  flex: 1;
  height: 88rpx;
  padding: 12rpx 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 25rpx;
}

.td__send {
  flex-shrink: 0;
  height: 88rpx;
  padding: 0 32rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
