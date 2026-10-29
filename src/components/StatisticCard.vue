<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    prefix?: string;
    delta?: string;
    deltaType?: "up" | "down" | "flat";
    accent?: boolean;
  }>(),
  { prefix: "", delta: "", deltaType: "flat", accent: false },
);
</script>

<template>
  <view class="stat" :class="{ 'stat--accent': accent }">
    <text class="stat__label">{{ label }}</text>
    <view class="stat__value">
      <text v-if="prefix" class="stat__prefix">{{ prefix }}</text>
      <text class="stat__num">{{ value }}</text>
    </view>
    <text v-if="delta" class="stat__delta" :class="`stat__delta--${deltaType}`">{{ delta }}</text>
  </view>
</template>

<style lang="scss" scoped>
.stat {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 24rpx;
  background: $surface;
  border: 1rpx solid $line-2;
  border-radius: $radius-lg;
}

.stat--accent {
  border-color: rgba(255, 255, 255, 0.12);
  background: linear-gradient(140deg, var(--qm-deep, #1d3f2e) 0%, var(--qm-deep-2, #12291e) 100%);

  .stat__label,
  .stat__value,
  .stat__num,
  .stat__prefix {
    color: #fff;
  }

  .stat__delta {
    color: rgba(255, 255, 255, 0.72);

    &--up {
      color: var(--qm-accent, #c9db9a);
    }

    &--down {
      color: #f0b3a6;
    }
  }
}

.stat__label {
  font-size: 24rpx;
  color: $text-sub;
}

.stat__value {
  display: flex;
  align-items: baseline;
}

.stat__prefix {
  font-size: 26rpx;
  font-weight: 700;
  margin-right: 2rpx;
}

.stat__num {
  font-size: 44rpx;
  font-weight: 700;
  color: $text-main;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat__delta {
  font-size: 22rpx;

  &--up {
    color: var(--qm-success, #3f6b4c);
  }

  &--down {
    color: var(--qm-danger, #a8422f);
  }

  &--flat {
    color: $text-sub;
  }
}
</style>
