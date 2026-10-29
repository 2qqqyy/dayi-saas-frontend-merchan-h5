<script setup lang="ts">
import type { TodoItem } from "@/types/business";
import { tr } from "@/utils/i18n";

defineProps<{ items: TodoItem[] }>();
const emit = defineEmits<{ (e: "select", item: TodoItem): void }>();
</script>

<template>
  <view class="todo card">
    <view
      v-for="(item, i) in items"
      :key="item.key"
      class="todo__row"
      :class="{ 'todo__row--last': i === items.length - 1 }"
      @tap="emit('select', item)"
    >
      <view class="todo__left">
        <text class="todo__label">{{ tr(item.label) }}</text>
      </view>
      <view class="todo__right">
        <text class="todo__count" :class="{ 'todo__count--warn': item.count > 0 }">{{ item.count }}</text>
        <text class="todo__arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.todo {
  padding: 0 28rpx;
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  border-radius: 28rpx;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(168%);
  -webkit-backdrop-filter: blur(20px) saturate(168%);
}

.todo__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.5);
}

.todo__row--last {
  border-bottom: none;
}

.todo__label {
  font-size: 28rpx;
  color: $text-main;
}

.todo__right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.todo__count {
  font-size: 30rpx;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: $text-mute;
}

.todo__count--warn {
  color: $price;
}

.todo__arrow {
  font-size: 28rpx;
  color: $text-mute;
}
</style>
