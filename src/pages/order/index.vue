<script setup lang="ts">
import { ref } from "vue";
import { onLoad, onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { useOrderStore } from "@/stores/order";
import { usePolling } from "@/composables/usePolling";
import { ORDER_STATUS_TABS } from "@/utils/constants";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import type { Order } from "@/types/business";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import MerchantTabBar from "@/components/MerchantTabBar.vue";
import OrderCard from "@/components/OrderCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();
const orderStore = useOrderStore();
const active = ref("all");

function load() {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  orderStore.fetchOrders(active.value === "all" ? undefined : active.value);
}

function onTab(value: string) {
  active.value = value;
  load();
}

onLoad((q) => {
  if (q?.tab) active.value = q.tab as string;
});

onShow(load);

// 游客下单/申请退款后，商家停在当前标签页 20s 内就能看到状态变化
usePolling(load, 20000);

function onDetail(order: Order) {
  go(`pages/order/detail?id=${order.id}`);
}

function onAction(order: Order) {
  if (order.status === "WAIT_VERIFY") {
    go("pages/order/verify");
  } else {
    go(`pages/order/detail?id=${order.id}`);
  }
}
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('订单管理')" />

    <view class="tabs">
      <view
        v-for="t in ORDER_STATUS_TABS"
        :key="t.value"
        class="tabs__item"
        :class="{ active: active === t.value }"
        @tap="onTab(t.value)"
      >
        {{ tr(t.label) }}
      </view>
    </view>

    <view class="order-list">
      <LoadingState v-if="orderStore.loading" :rows="3" />
      <EmptyState
        v-else-if="!orderStore.orderList.length"
        :title="tr('暂无相关订单')"
        :description="tr('当前筛选条件下没有订单')"
      />
      <template v-else>
        <OrderCard
          v-for="o in orderStore.orderList"
          :key="o.id"
          :order="o"
          @select="onDetail(o)"
          @action="onAction(o)"
        />
      </template>
    </view>

    <MerchantTabBar current="order" />
  </view>
</template>

<style lang="scss" scoped>
.tabs {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16rpx 24rpx;
  position: sticky;
  top: 0;
  background: $bg;
  z-index: 10;
}

.tabs__item {
  display: inline-flex;
  align-items: center;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background: $surface;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.order-list {
  padding: 8rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
</style>
