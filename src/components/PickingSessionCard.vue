<script setup lang="ts">
import { computed } from "vue";
import type { PickingSession } from "@/types/business";
import { formatDate } from "@/utils/format";
import StatusTag from "@/components/StatusTag.vue";

const props = defineProps<{ session: PickingSession }>();

const emit = defineEmits<{
  (e: "select"): void;
  (e: "edit"): void;
  (e: "duplicate"): void;
  (e: "primary"): void;
}>();

const remaining = computed(() => props.session.maxPeople - props.session.booked);

const primaryText = computed(() => {
  if (props.session.status === "DRAFT") return "发布";
  if (props.session.status === "PUBLISHED" || props.session.status === "FULL") return "关闭";
  return "";
});
</script>

<template>
  <view class="session card" @tap="emit('select')">
    <view class="session__head">
      <view class="session__date">
        <text class="session__day">{{ formatDate(session.date, "M月D日") }}</text>
        <text class="session__time">{{ session.startTime }} - {{ session.endTime }}</text>
      </view>
      <StatusTag :status="session.status" kind="picking" />
    </view>

    <view class="session__body">
      <text class="session__name">{{ session.orchardName }} · 青梅采摘体验</text>
      <view class="session__meta">
        <text class="session__price">¥{{ session.adultPrice }} / 人</text>
        <text class="session__booked">预约 {{ session.booked }} / {{ session.maxPeople }}</text>
      </view>
      <view class="session__capacity">
        <view class="session__bar">
          <view class="session__bar-inner" :style="{ width: (session.booked / session.maxPeople * 100) + '%' }" />
        </view>
        <text class="session__remain">
          {{ remaining === 0 ? "已约满" : `剩余 ${remaining}` }}
        </text>
      </view>
    </view>

    <view class="session__actions" @tap.stop>
      <view class="session__btn" @tap="emit('edit')">编辑</view>
      <view class="session__btn" @tap="emit('duplicate')">复制</view>
      <view v-if="primaryText" class="session__btn session__btn--primary" @tap="emit('primary')">
        {{ primaryText }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.session {
  padding: 24rpx;
}

.session__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.session__day {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
  margin-right: 16rpx;
}

.session__time {
  font-size: 24rpx;
  color: $text-sub;
}

.session__name {
  font-size: 28rpx;
  color: $text-main;
}

.session__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.session__price {
  font-size: 30rpx;
  font-weight: 700;
  color: $green;
}

.session__booked {
  font-size: 24rpx;
  color: $text-sub;
}

.session__capacity {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 16rpx;
}

.session__bar {
  flex: 1;
  height: 12rpx;
  border-radius: 6rpx;
  background: $green-soft;
  overflow: hidden;
}

.session__bar-inner {
  height: 100%;
  border-radius: 6rpx;
  background: $green;
}

.session__remain {
  font-size: 22rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.session__actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid $line-2;
}

.session__btn {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $green-soft;
  color: $text-main;
  font-size: 26rpx;

  &--primary {
    background: $green-bg;
    color: $green;
    font-weight: 600;
  }
}
</style>
