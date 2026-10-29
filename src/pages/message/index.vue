<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { useRequest } from "@/composables/useRequest";
import { usePolling } from "@/composables/usePolling";
import { getMessages, markRead, markAllRead } from "@/api/message";
import { MESSAGE_TYPE_TEXT } from "@/utils/constants";
import { go } from "@/utils/navigation";
import { tc, tr } from "@/utils/i18n";
import type { MessageItem } from "@/types/business";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import MerchantTabBar from "@/components/MerchantTabBar.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

const tabs = ["全部", "订单通知", "系统通知", "库存提醒", "审核通知"];
const active = ref("全部");

const { loading, data, run } = useRequest(() => getMessages().then((r) => r.data));

const list = computed(() => {
  const all = data.value ?? [];
  if (active.value === "全部") return all;
  const type = Object.keys(MESSAGE_TYPE_TEXT).find((k) => MESSAGE_TYPE_TEXT[k] === active.value);
  return all.filter((m) => m.type === type);
});

function onTab(t: string) {
  active.value = t;
}

async function onTap(msg: MessageItem) {
  if (!msg.read) {
    await markRead(msg.id);
    run();
  }
  if (msg.orderId) {
    go(`pages/order/detail?id=${msg.orderId}`);
  }
}

async function onMarkAll() {
  await markAllRead();
  run();
  uni.showToast({ title: tr("已全部标记为已读"), icon: "none" });
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  run();
});

// 订单通知由后端在下单/退款时写入，30s 轮询让商家不必手动进页面刷
usePolling(run, 30000);
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('消息中心')">
      <template #right>
        <text class="msg__mark" @tap="onMarkAll">{{ tr("全部已读") }}</text>
      </template>
    </MerchantNavbar>

    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t"
        class="tabs__item"
        :class="{ active: active === t }"
        @tap="onTab(t)"
      >
        {{ tr(t) }}
      </view>
    </view>

    <view class="msg__list">
      <EmptyState v-if="!loading && !list.length" :title="tr('暂无消息')" />
      <view v-for="m in list" :key="m.id" class="msg__item card" @tap="onTap(m)">
        <view class="msg__head">
          <view class="msg__title-row">
            <view v-if="!m.read" class="msg__dot" />
            <text class="msg__title">{{ tc(m.title, m.titleEn) }}</text>
          </view>
          <text class="msg__time">{{ m.time }}</text>
        </view>
        <text class="msg__content">{{ tc(m.content, m.contentEn) }}</text>
        <view class="msg__foot">
          <text class="msg__type">{{ tr(MESSAGE_TYPE_TEXT[m.type]) }}</text>
          <text class="msg__more">{{ tr("查看 ›") }}</text>
        </view>
      </view>
    </view>

    <MerchantTabBar current="message" />
  </view>
</template>

<style lang="scss" scoped>
.msg__mark {
  font-size: 26rpx;
  color: $green;
}

.tabs {
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16rpx 24rpx;
  background: $bg;
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

.msg__list {
  padding: 8rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.msg__item {
  padding: 24rpx;
}

.msg__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.msg__title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.msg__dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: $danger;
}

.msg__title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.msg__time {
  font-size: 22rpx;
  color: $text-mute;
}

.msg__content {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.msg__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}

.msg__type {
  font-size: 22rpx;
  color: $green;
  padding: 4rpx 16rpx;
  background: $green-bg;
  border-radius: 8rpx;
}

.msg__more {
  font-size: 22rpx;
  color: $text-mute;
}
</style>
