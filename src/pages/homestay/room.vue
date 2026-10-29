<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getRoom, updateRoomStatus, deleteRoom } from "@/api/homestay";
import { go, goBack } from "@/utils/navigation";
import type { Room, RoomStatus } from "@/types/business";
import { ROOM_STATUS_TEXT } from "@/utils/constants";
import { imgSrc } from "@/utils/image";
import StatusTag from "@/components/StatusTag.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const room = ref<Room | null>(null);
const statusKeys = Object.keys(ROOM_STATUS_TEXT) as RoomStatus[];
const statusLabels = Object.values(ROOM_STATUS_TEXT).map((v) => tr(v));

onLoad(async (query) => {
  const id = query?.id as string;
  const res = await getRoom(id);
  room.value = res.data;
});

function onStatusChange(e: any) {
  const status = statusKeys[Number(e.detail.value)];
  updateRoomStatus(room.value!.id, status).then(() => reload());
}

function onDelete() {
  uni.showModal({
    title: tr("删除房间"),
    content: tr("确定删除「{name}」吗？").replace("{name}", room.value!.name),
    success: (r) => {
      if (r.confirm) {
        deleteRoom(room.value!.id).then(() => {
          uni.showToast({ title: tr("已删除"), icon: "none" });
          setTimeout(() => goBack(), 400);
        });
      }
    },
  });
}

async function reload() {
  if (!room.value) return;
  const res = await getRoom(room.value.id);
  room.value = res.data;
  uni.showToast({ title: tr("已更新"), icon: "none" });
}
</script>

<template>
  <view class="room" :class="qmClass" v-if="room">
    <MerchantNavbar :title="tr('房间详情')" show-back show-home />
    <image class="room__img" :src="imgSrc(room.image)" mode="aspectFill" />

    <view class="room__card card">
      <view class="room__head">
        <text class="room__name">{{ room.name }}</text>
        <StatusTag :status="room.status" kind="room" />
      </view>
      <view class="room__price">
        <text class="room__price-num">¥{{ room.price }}</text>
        <text class="room__price-unit">/ {{ tr("晚") }}</text>
      </view>
      <view class="room__row">
        <text class="room__label">{{ tr("床型") }}</text>
        <text class="room__value">{{ room.bedType }}</text>
      </view>
      <view class="room__row">
        <text class="room__label">{{ tr("可住人数") }}</text>
        <text class="room__value">{{ room.capacity }} {{ tr("人") }}</text>
      </view>
      <view class="room__row">
        <text class="room__label">{{ tr("早餐") }}</text>
        <text class="room__value">{{ room.breakfast }}</text>
      </view>
      <view class="room__row">
        <text class="room__label">{{ tr("剩余库存") }}</text>
        <text class="room__value">{{ room.stock }} {{ tr("间") }}</text>
      </view>
      <view class="room__row room__row--top">
        <text class="room__label">{{ tr("房间设施") }}</text>
        <text class="room__value">{{ room.facilities.join("、") }}</text>
      </view>
      <view class="room__row room__row--top">
        <text class="room__label">{{ tr("房间描述") }}</text>
        <text class="room__value">{{ room.description }}</text>
      </view>
    </view>

    <view class="room__card card">
      <text class="room__section-title">{{ tr("房间状态") }}</text>
      <picker :range="statusLabels" @change="onStatusChange">
        <view class="room__status-picker">
          <text>{{ tr(ROOM_STATUS_TEXT[room.status]) }}</text>
          <text class="room__status-arrow">›</text>
        </view>
      </picker>
    </view>

    <view class="room__actions">
      <view class="btn-ghost" @tap="go(`pages/homestay/calendar?roomId=${room.id}`)">{{ tr("库存日历") }}</view>
      <view class="btn-primary" @tap="go(`pages/homestay/room-edit?id=${room.id}`)">{{ tr("编辑房间") }}</view>
    </view>

    <view class="room__delete" @tap="onDelete">{{ tr("删除房间") }}</view>
  </view>
</template>

<style lang="scss" scoped>
.room {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.room__img {
  width: 100%;
  height: 360rpx;
  border-radius: $radius-lg;
  background: $green-soft;
}

.room__card {
  padding: 24rpx;
}

.room__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.room__name {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-main;
}

.room__price {
  display: flex;
  align-items: baseline;
  margin: 16rpx 0;
}

.room__price-num {
  font-size: 44rpx;
  font-weight: 800;
  color: $price;
}

.room__price-unit {
  font-size: 24rpx;
  color: $text-sub;
}

.room__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14rpx 0;
  gap: 24rpx;

  &--top {
    align-items: flex-start;
  }
}

.room__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.room__value {
  font-size: 26rpx;
  color: $text-main;
  text-align: right;
  flex: 1;
}

.room__section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
  margin-bottom: 16rpx;
}

.room__status-picker {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72rpx;
  padding: 0 24rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 28rpx;
  color: $text-main;
}

.room__status-arrow {
  color: #c0c6c1;
}

.room__actions {
  display: flex;
  gap: 20rpx;

  .btn-primary,
  .btn-ghost {
    flex: 1;
  }
}

.room__delete {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: var(--qm-danger-bg, #f5e3dd);
  color: $danger;
  font-size: 30rpx;
  font-weight: 600;
}
</style>
