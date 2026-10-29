<script setup lang="ts">
withDefaults(defineProps<{ rows?: number }>(), { rows: 3 });
</script>

<template>
  <view class="loading">
    <view v-for="i in rows" :key="i" class="loading__card">
      <view class="skeleton loading__line" style="width: 40%" />
      <view class="skeleton loading__line" style="width: 70%" />
      <view class="skeleton loading__line" style="width: 52%" />
    </view>
  </view>
</template>

<style lang="scss" scoped>
.loading {
  display: flex;
  flex-direction: column;
  gap: $space-md;
}

.loading__card {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  padding: 24rpx;
  background: $surface;
  border-radius: $radius-md;
}

.loading__line {
  height: 28rpx;
  border-radius: 8rpx;
}

.skeleton {
  background: linear-gradient(90deg, var(--qm-line-2, $green-soft) 25%, var(--qm-soft, #f6f8f4) 50%, var(--qm-line-2, $green-soft) 75%);
  background-size: 400% 100%;
  animation: shimmer 1.4s ease infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: 0 0;
  }
}
</style>
