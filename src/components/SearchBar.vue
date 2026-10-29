<script setup lang="ts">
withDefaults(
  defineProps<{
    modelValue?: string;
    placeholder?: string;
    readonly?: boolean;
  }>(),
  { modelValue: "", placeholder: "搜索", readonly: false },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", value: string): void;
  (e: "select"): void;
}>();
</script>

<template>
  <view class="searchbar" @tap="emit('select')">
    <image class="searchbar__icon" src="/static/icons/icon-search-gray.svg" mode="aspectFit" />
    <input
      class="searchbar__input"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="readonly"
      placeholder-class="searchbar__placeholder"
      @input="emit('update:modelValue', ($event.detail as any).value)"
      @confirm="emit('search', modelValue)"
    />
  </view>
</template>

<style lang="scss" scoped>
.searchbar {
  display: flex;
  align-items: center;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: $radius-lg;
  background: $surface;
  gap: 12rpx;
  box-shadow: 0 4rpx 16rpx rgba(38, 53, 42, 0.04);
}

.searchbar__icon {
  width: 34rpx;
  height: 34rpx;
  flex-shrink: 0;
}

.searchbar__input {
  flex: 1;
  height: 100%;
  font-size: 28rpx;
  color: $text-main;
}

.searchbar__placeholder {
  color: $text-sub;
}
</style>
