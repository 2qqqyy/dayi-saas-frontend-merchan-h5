<script setup lang="ts">
export interface DashItem {
  label: string;
  value: string | number;
  prefix?: string;
  accent?: boolean;
  path?: string;
}

defineProps<{ items: DashItem[] }>();
const emit = defineEmits<{ (e: "select", item: DashItem): void }>();
</script>

<template>
  <view class="dash">
    <view
      v-for="item in items"
      :key="item.label"
      class="dash__item"
      :class="item.accent ? 'dash__item--hero' : 'dash__item--cell'"
      @tap="item.path && emit('select', item)"
    >
      <template v-if="item.accent">
        <text class="dash__label">{{ item.label }}</text>
        <view class="dash__hero-value">
          <text v-if="item.prefix" class="dash__hero-prefix">{{ item.prefix }}</text>
          <text class="dash__hero-num tnum">{{ item.value }}</text>
        </view>
      </template>
      <template v-else>
        <text class="dash__num tnum">{{ item.value }}</text>
        <text class="dash__label">{{ item.label }}</text>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dash {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  padding: 28rpx 8rpx 6rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  border-radius: 28rpx;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

.dash__item {
  display: flex;
  flex-direction: column;
}

.dash__item--hero {
  width: 100%;
  padding: 0 20rpx 26rpx;
  border-bottom: 1rpx solid $line;
}

.dash__label {
  font-size: 20rpx;
  letter-spacing: 0.04em;
  color: $text-mute;
}

.dash__hero-value {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  margin-top: 8rpx;
}

.dash__hero-prefix {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.dash__hero-num {
  font-size: 76rpx;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: $text-main;
}

.dash__item--cell {
  flex: 1;
  align-items: center;
  gap: 4rpx;
  padding: 24rpx 0 18rpx;
}

.dash__item--cell + .dash__item--cell {
  border-left: 1rpx solid $line;
}

.dash__num {
  font-size: 38rpx;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: $text-main;
}
</style>
