<script setup lang="ts">
import { useAppStore } from "@/stores/app";
import { goBack } from "@/utils/navigation";

withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    showBack?: boolean;
    showHome?: boolean;
  }>(),
  { title: "", subtitle: "", showBack: false, showHome: false },
);

const appStore = useAppStore();

function toHome() {
  uni.reLaunch({ url: "/pages/index/index" });
}
</script>

<template>
  <view class="navbar" :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
    <view class="navbar__inner">
      <view class="navbar__left">
        <view v-if="showBack" class="navbar__btn" @tap="goBack">
          <view class="navbar__chevron" />
        </view>
      </view>
      <view class="navbar__titles" :class="{ 'navbar__titles--center': showBack || showHome }">
        <text v-if="title" class="navbar__title">{{ title }}</text>
        <text v-if="subtitle" class="navbar__subtitle">{{ subtitle }}</text>
      </view>
      <view class="navbar__right">
        <slot name="right" />
        <view v-if="showHome" class="navbar__btn" @tap="toHome">
          <image class="navbar__home-icon" src="/static/icons/icon-house-green.svg" mode="aspectFit" />
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 90;
  background: $surface;
  border-bottom: 1rpx solid $line-2;
}

.navbar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 16rpx;
}

.navbar__left,
.navbar__right {
  display: flex;
  align-items: center;
  min-width: 72rpx;
}

.navbar__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  color: $text-main;

  &:active {
    background: $line-2;
  }
}

.navbar__chevron {
  width: 18rpx;
  height: 18rpx;
  margin-left: 6rpx;
  border-left: 3rpx solid currentColor;
  border-bottom: 3rpx solid currentColor;
  transform: rotate(45deg);
}

.navbar__home-icon {
  width: 36rpx;
  height: 36rpx;
}

.navbar__titles {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
}

.navbar__titles--center {
  align-items: center;
}

.navbar__title {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-main;
  white-space: nowrap;
}

.navbar__subtitle {
  font-size: 22rpx;
  color: $text-sub;
}
</style>
