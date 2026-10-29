<script setup lang="ts">
import { ref, onMounted } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { go } from "@/utils/navigation";
import { getUnreadCount } from "@/api/message";
import { tr } from "@/utils/i18n";

const props = defineProps<{ current: string }>();

interface TabItem {
  key: string;
  label: string;
  path: string;
  icon: string;
  iconActive: string;
}

const tabs: TabItem[] = [
  { key: "index", label: "首页", path: "pages/index/index", icon: "/static/icons/tab-home-gray.svg", iconActive: "/static/icons/tab-home-green.svg" },
  { key: "order", label: "订单", path: "pages/order/index", icon: "/static/icons/tab-order-gray.svg", iconActive: "/static/icons/tab-order-green.svg" },
  { key: "statistics", label: "经营", path: "pages/statistics/index", icon: "/static/icons/tab-stat-gray.svg", iconActive: "/static/icons/tab-stat-green.svg" },
  { key: "message", label: "消息", path: "pages/message/index", icon: "/static/icons/tab-msg-gray.svg", iconActive: "/static/icons/tab-msg-green.svg" },
  { key: "user", label: "我的", path: "pages/user/index", icon: "/static/icons/tab-user-gray.svg", iconActive: "/static/icons/tab-user-green.svg" },
];

const unread = ref(0);

async function loadUnread() {
  try {
    const res = await getUnreadCount();
    unread.value = res.data;
  } catch (e) {
    unread.value = 0;
  }
}

onMounted(loadUnread);
onShow(loadUnread);

function onTap(tab: TabItem) {
  if (tab.key === props.current) return;
  go(tab.path);
}
</script>

<template>
  <view class="tabbar">
    <view v-for="tab in tabs" :key="tab.key" class="tabbar__item" :class="{ active: tab.key === current }" @tap="onTap(tab)">
      <view class="tabbar__icon" :class="{ active: tab.key === current }">
        <image class="tabbar__img" :src="tab.key === current ? tab.iconActive : tab.icon" mode="aspectFit" />
        <view v-if="tab.key === 'message' && unread > 0" class="tabbar__badge">
          <text v-if="unread > 99">99+</text>
          <text v-else>{{ unread }}</text>
        </view>
      </view>
      <text class="tabbar__label" :class="{ active: tab.key === current }">{{ tr(tab.label) }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.tabbar {
  position: fixed;
  left: 50%;
  bottom: calc(18rpx + env(safe-area-inset-bottom));
  z-index: 100;
  display: flex;
  align-items: center;
  width: calc(100% - 40rpx);
  max-width: 460px;
  height: 112rpx;
  padding: 8rpx;
  transform: translateX(-50%);
  border-radius: 32rpx;
  background: var(--qm-glass-2, rgba(255, 255, 255, 0.5));
  border: 1rpx solid var(--qm-glass-edge, rgba(255, 255, 255, 0.72));
  box-shadow: 0 30rpx 70rpx -30rpx rgba(16, 36, 26, 0.55), inset 0 2rpx 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .tabbar { background: var(--qm-surface, rgba(255, 255, 255, 0.9)); }
}

.tabbar__item {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border-radius: 24rpx;
  transition: background 0.28s $ease, box-shadow 0.28s $ease;
}

.tabbar__item.active {
  background: var(--qm-glass-3, rgba(255, 255, 255, 0.58));
  box-shadow: inset 0 1rpx 0 rgba(255, 255, 255, 0.95), 0 8rpx 20rpx -14rpx rgba(16, 36, 26, 0.45);
}

.tabbar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44rpx;
  opacity: 0.45;
  transition: opacity 0.24s $ease;
}

.tabbar__icon.active {
  opacity: 1;
}

.tabbar__img {
  width: 44rpx;
  height: 44rpx;
}

.tabbar__label {
  font-size: 20rpx;
  line-height: 1.2;
  color: $text-sub;
  transition: color 0.24s $ease;
}

.tabbar__label.active {
  color: $ink;
  font-weight: 600;
}

.tabbar__badge {
  position: absolute;
  top: -8rpx;
  right: -16rpx;
  min-width: 28rpx;
  height: 28rpx;
  padding: 0 8rpx;
  border-radius: 14rpx;
  background: $price;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
