<script setup lang="ts">
withDefaults(
  defineProps<{
    dates: { date: string; label: string }[];
    modelValue?: string;
  }>(),
  { modelValue: "" },
);

const emit = defineEmits<{ (e: "update:modelValue", value: string): void }>();
</script>

<template>
  <view class="date-selector">
    <view
      v-for="d in dates"
      :key="d.date"
      class="date-selector__item"
      :class="{ active: modelValue === d.date }"
      @tap="emit('update:modelValue', d.date)"
    >
      <text class="date-selector__label">{{ d.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.date-selector {
  display: flex;
  gap: 12rpx;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4rpx 0;
}

.date-selector__item {
  flex-shrink: 0;
  min-width: 96rpx;
  height: 72rpx;
  padding: 0 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: $surface;
  color: $text-main;
  font-size: 24rpx;
  border: 1rpx solid $line;

  &.active {
    background: $green;
    color: #f7f3e6;
    border-color: $green;
  }
}
</style>
