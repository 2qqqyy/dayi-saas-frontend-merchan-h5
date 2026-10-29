<script setup lang="ts">
export interface QuickItem {
  key: string;
  label: string;
  icon: string;
  path: string;
}

defineProps<{ items: QuickItem[] }>();
const emit = defineEmits<{ (e: "select", item: QuickItem): void }>();
</script>

<template>
  <view class="quick">
    <view v-for="item in items" :key="item.key" class="quick__cell" @tap="emit('select', item)">
      <view class="quick__icon">
        <image class="quick__icon-img" :src="item.icon" mode="aspectFit" />
      </view>
      <text class="quick__label">{{ item.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.quick {
  display: flex;
  flex-wrap: wrap;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  border-radius: 28rpx;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
  padding: 12rpx 8rpx;
}

.quick__cell {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 22rpx 0;
  transition: opacity 0.16s $ease;
}

.quick__cell:active {
  opacity: 0.55;
}

.quick__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  border: 1rpx solid $line-strong;
  background: transparent;
}

.quick__icon-img {
  width: 36rpx;
  height: 36rpx;
}

.quick__label {
  font-size: 22rpx;
  color: $text-sub;
}
</style>
