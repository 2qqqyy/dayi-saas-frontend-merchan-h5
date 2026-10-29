<script setup lang="ts">
import type { Room } from "@/types/business";
import StatusTag from "@/components/StatusTag.vue";
import { imgSrc } from "@/utils/image";

defineProps<{ room: Room }>();

const emit = defineEmits<{
  (e: "select"): void;
  (e: "edit"): void;
  (e: "calendar"): void;
}>();
</script>

<template>
  <view class="room card" @tap="emit('select')">
    <view class="room__media">
      <image class="room__img" :src="imgSrc(room.image)" mode="aspectFill" />
      <text class="room__stock" :class="{ 'room__stock--empty': room.stock <= 0 }">
        {{ room.stock <= 0 ? "已满房" : `剩 ${room.stock} 间` }}
      </text>
    </view>
    <view class="room__body">
      <view class="room__top">
        <text class="room__name">{{ room.name }}</text>
        <StatusTag :status="room.status" kind="room" />
      </view>
      <text class="room__bed">{{ room.bedType }} · 可住 {{ room.capacity }}人 · {{ room.breakfast }}</text>
      <view class="room__bottom">
        <view class="room__price">
          <text class="room__price-num">¥{{ room.price }}</text>
          <text class="room__price-unit">/ 晚</text>
        </view>
        <view class="room__actions" @tap.stop>
          <view class="room__btn" @tap="emit('calendar')">日历</view>
          <view class="room__btn room__btn--primary" @tap="emit('edit')">编辑</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.room {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
}

.room__media {
  position: relative;
  width: 216rpx;
  height: 162rpx;
  border-radius: $radius-md;
  overflow: hidden;
  flex-shrink: 0;
  background: $green-soft;
}

.room__img {
  width: 100%;
  height: 100%;
}

.room__stock {
  position: absolute;
  left: 0;
  bottom: 0;
  padding: 4rpx 12rpx;
  border-radius: 0 $radius-sm 0 $radius-md;
  background: rgba(8, 18, 12, 0.6);
  color: #fff;
  font-size: 20rpx;

  &--empty {
    background: rgba(245, 108, 108, 0.9);
  }
}

.room__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 162rpx;
}

.room__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.room__name {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.room__bed {
  margin-top: 10rpx;
  font-size: 22rpx;
  color: $text-sub;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.room__bottom {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.room__price {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.room__price-num {
  font-size: 36rpx;
  font-weight: 800;
  color: $price;
}

.room__price-unit {
  font-size: 22rpx;
  color: $text-sub;
}

.room__actions {
  display: flex;
  gap: 12rpx;
}

.room__btn {
  height: 64rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $green-soft;
  color: $text-main;
  font-size: 24rpx;

  &--primary {
    background: $green-bg;
    color: $green;
    font-weight: 600;
  }
}
</style>
