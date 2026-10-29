<script setup lang="ts">
withDefaults(
  defineProps<{
    primaryText: string;
    secondaryText?: string;
    primaryDisabled?: boolean;
  }>(),
  { secondaryText: "", primaryDisabled: false },
);

const emit = defineEmits<{
  (e: "primary"): void;
  (e: "secondary"): void;
}>();
</script>

<template>
  <view class="bar">
    <view v-if="secondaryText" class="bar__btn bar__btn--ghost" @tap="emit('secondary')">
      {{ secondaryText }}
    </view>
    <view
      class="bar__btn bar__btn--primary"
      :class="{ 'bar__btn--disabled': primaryDisabled }"
      @tap="!primaryDisabled && emit('primary')"
    >
      {{ primaryText }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.bar {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  z-index: 90;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 24rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: $surface;
  box-shadow: 0 -6rpx 24rpx rgba(38, 53, 42, 0.06);
}

.bar__btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  font-size: 30rpx;
  font-weight: 600;

  &--primary {
    background: $green;
    color: #f7f3e6;
  }

  &--ghost {
    background: $green-bg;
    color: $green;
  }

  &--disabled {
    background: $disabled;
    color: $text-mute;
  }
}
</style>
