<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import * as pickingApi from "@/api/picking";
import { go, goBack } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import type { PickingSession } from "@/types/business";
import StatusTag from "@/components/StatusTag.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const session = ref<PickingSession | null>(null);

onLoad(async (query) => {
  const id = query?.id as string;
  const res = await pickingApi.getPickingSession(id);
  session.value = res.data;
});

const remaining = computed(() => {
  if (!session.value) return 0;
  return session.value.maxPeople - session.value.booked;
});

const actionText = computed(() => {
  if (!session.value) return "";
  if (session.value.status === "DRAFT") return tr("发布场次");
  if (session.value.status === "PUBLISHED") return tr("关闭场次");
  if (session.value.status === "FULL") return tr("暂停预约");
  return "";
});

function onAction() {
  if (!session.value) return;
  const s = session.value;
  if (s.status === "DRAFT") {
    pickingApi.publishPickingSession(s.id).then(() => reload());
  } else if (s.status === "PUBLISHED" || s.status === "FULL") {
    pickingApi.closePickingSession(s.id).then(() => reload());
  }
}

async function reload() {
  if (!session.value) return;
  const res = await pickingApi.getPickingSession(session.value.id);
  session.value = res.data;
  uni.showToast({ title: tr("操作成功"), icon: "none" });
}
</script>

<template>
  <view class="detail" :class="qmClass" v-if="session">
    <MerchantNavbar :title="tr('场次详情')" show-back show-home />
    <view class="detail__card card">
      <view class="detail__head">
        <view>
          <text class="detail__name">{{ session.orchardName }} · {{ tr("青梅采摘体验") }}</text>
          <text class="detail__time">{{ session.date }}　{{ session.startTime }} - {{ session.endTime }}</text>
        </view>
        <StatusTag :status="session.status" kind="picking" />
      </view>
    </view>

    <view class="detail__card card">
      <view class="detail__row">
        <text class="detail__label">{{ tr("采摘单价") }}</text>
        <text class="detail__value">¥{{ session.adultPrice }} / {{ tr("人") }}</text>
      </view>
    </view>

    <view class="detail__card card">
      <text class="detail__title">{{ tr("场次容量") }}</text>
      <view class="detail__capacity">
        <view class="detail__capacity-line">
          <text>{{ tr("已预约：") }}{{ session.booked }}</text>
          <text>{{ tr("总容量：") }}{{ session.maxPeople }}</text>
          <text class="detail__remain">{{ remaining === 0 ? tr("已约满") : tr("剩余：") + remaining }}</text>
        </view>
        <view class="detail__bar">
          <view class="detail__bar-inner" :style="{ width: (session.booked / session.maxPeople * 100) + '%' }" />
        </view>
      </view>
    </view>

    <view class="detail__actions">
      <view class="btn-ghost" @tap="go(`pages/picking/edit?id=${session.id}`)">{{ tr("编辑") }}</view>
      <view v-if="actionText" class="btn-primary" @tap="onAction">{{ actionText }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail__card {
  padding: 24rpx;
}

.detail__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.detail__name {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
}

.detail__time {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  color: $text-sub;
}

.detail__title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
  margin-bottom: 16rpx;
}

.detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}

.detail__label {
  font-size: 26rpx;
  color: $text-sub;
}

.detail__value {
  font-size: 28rpx;
  color: $text-main;
  font-weight: 600;
}

.detail__capacity-line {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: $text-sub;
}

.detail__remain {
  color: $green;
  font-weight: 600;
}

.detail__bar {
  height: 16rpx;
  border-radius: 8rpx;
  background: $green-soft;
  overflow: hidden;
  margin-top: 16rpx;
}

.detail__bar-inner {
  height: 100%;
  background: $green;
  border-radius: 8rpx;
}

.detail__actions {
  display: flex;
  gap: 20rpx;
  margin-top: 16rpx;

  .btn-primary,
  .btn-ghost {
    flex: 1;
  }
}
</style>
