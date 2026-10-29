<script setup lang="ts">
import { tr } from "@/utils/i18n";

withDefaults(
  defineProps<{
    title?: string;
    description?: string;
    actionText?: string;
  }>(),
  { title: "暂无内容", description: "", actionText: "" },
);

const emit = defineEmits<{ (e: "action"): void }>();
</script>

<template>
  <view class="empty">
    <view class="empty__icon">
      <image class="empty__icon-img" src="/static/icons/icon-box-light.svg" mode="aspectFit" />
    </view>
    <text class="empty__title">{{ tr(title) }}</text>
    <text v-if="description" class="empty__desc">{{ tr(description) }}</text>
    <view v-if="actionText" class="empty__action" @tap="emit('action')">
      <text>{{ tr(actionText) }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
}

.empty__icon-img {
  width: 96rpx;
  height: 96rpx;
  opacity: 0.5;
  margin-bottom: 24rpx;
}

.empty__title {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.empty__desc {
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-sub;
  text-align: center;
}

.empty__action {
  margin-top: 32rpx;
  padding: 16rpx 48rpx;
  border-radius: 40rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 26rpx;
}
</style>
