<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { getTickets, TICKET_CATEGORY, TICKET_STATUS, type MTicketRow } from "@/api/ticket";
import { tr } from "@/utils/i18n";
import { go } from "@/utils/navigation";
import { useQmClass } from "@/composables/useQmClass";

const qmClass = useQmClass();
const loading = ref(true);
const list = ref<MTicketRow[]>([]);
const filter = ref<number | undefined>(undefined);

const TABS: { label: string; v?: number }[] = [
  { label: "全部" },
  { label: "待处理", v: 0 },
  { label: "处理中", v: 1 },
  { label: "已解决", v: 2 },
  { label: "已关闭", v: 3 },
];

async function load() {
  loading.value = true;
  try {
    const res = await getTickets(filter.value);
    list.value = res.data ?? [];
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function onTab(v?: number) {
  filter.value = v;
  load();
}

onShow(load);
</script>

<template>
  <view class="tk" :class="qmClass">
    <MerchantNavbar :title="tr('售后工单')" show-back show-home />

    <view class="tk__tabs">
      <view
        v-for="t in TABS"
        :key="t.label"
        class="tk__tab"
        :class="{ 'tk__tab--on': filter === t.v }"
        @tap="onTab(t.v)"
      >{{ tr(t.label) }}</view>
    </view>

    <LoadingState v-if="loading" :rows="3" />
    <EmptyState v-else-if="!list.length" :title="tr('暂无售后工单')" :description="tr('游客发起的售后与投诉会出现在这里')" />

    <view v-else class="tk__list">
      <view
        v-for="row in list"
        :key="row.ticket.id"
        class="tk__item card"
        @tap="go('pages/ticket/detail?id=' + row.ticket.id)"
      >
        <view class="tk__row">
          <text class="tk__title">{{ row.ticket.title }}</text>
          <text v-if="row.ticket.priority === 1" class="tk__flag">{{ tr("平台介入") }}</text>
          <text class="tk__status">{{ tr(TICKET_STATUS[row.ticket.status]) }}</text>
        </view>
        <text class="tk__last">{{ row.lastMessage }}</text>
        <view class="tk__meta">
          <text>{{ row.userName }} · {{ tr(TICKET_CATEGORY[row.ticket.category] || "其他咨询") }}</text>
          <text>{{ (row.ticket.updateTime || "").slice(0, 16).replace("T", " ") }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tk {
  min-height: 100vh;
  background: $bg;
}

.tk__tabs {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
}

.tk__tab {
  padding: 10rpx 26rpx;
  border-radius: 999rpx;
  background: $surface;
  color: $text-sub;
  font-size: 24rpx;
}

.tk__tab--on {
  background: $green;
  color: #f7f3e6;
}

.tk__list {
  padding: 4rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.tk__item {
  padding: 24rpx;
}

.tk__row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.tk__title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.tk__flag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(168, 66, 47, 0.1);
  color: $danger;
}

.tk__status {
  font-size: 21rpx;
  color: $text-mute;
}

.tk__last {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: $text-sub;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.tk__meta {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  font-size: 21rpx;
  color: $text-mute;
}
</style>
