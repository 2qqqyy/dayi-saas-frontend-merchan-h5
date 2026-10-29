<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getRooms } from "@/api/homestay";
import { go } from "@/utils/navigation";
import type { Room } from "@/types/business";
import RoomCard from "@/components/RoomCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const rooms = ref<Room[]>([]);
const loading = ref(true);

const openCount = computed(() => rooms.value.filter((r) => r.status === "OPEN").length);
const priceRange = computed(() => {
  if (!rooms.value.length) return "";
  const prices = rooms.value.map((r) => Number(r.price));
  return `¥${Math.min(...prices)} - ${Math.max(...prices)}`;
});

async function load() {
  loading.value = true;
  const res = await getRooms();
  rooms.value = res.data;
  loading.value = false;
}

onShow(load);
</script>

<template>
  <view class="homestay" :class="qmClass">
    <MerchantNavbar :title="tr('房间管理')" show-back show-home />

    <view v-if="!loading && rooms.length" class="homestay__sum">
      <view class="homestay__sum-item">
        <text class="homestay__sum-num">{{ rooms.length }}</text>
        <text class="homestay__sum-label">{{ tr("房型总数") }}</text>
      </view>
      <view class="homestay__sum-divider" />
      <view class="homestay__sum-item">
        <text class="homestay__sum-num">{{ openCount }}</text>
        <text class="homestay__sum-label">{{ tr("营业中") }}</text>
      </view>
      <view class="homestay__sum-divider" />
      <view class="homestay__sum-item">
        <text class="homestay__sum-num homestay__sum-num--sm">{{ priceRange }}</text>
        <text class="homestay__sum-label">{{ tr("价格区间/晚") }}</text>
      </view>
    </view>

    <view class="homestay__list">
      <LoadingState v-if="loading" :rows="3" />
      <EmptyState v-else-if="!rooms.length" :title="tr('暂无房间')" :description="tr('点击下方按钮新增房型')" />
      <template v-else>
        <RoomCard
          v-for="r in rooms"
          :key="r.id"
          :room="r"
          @select="go(`pages/homestay/room?id=${r.id}`)"
          @edit="go(`pages/homestay/room-edit?id=${r.id}`)"
          @calendar="go(`pages/homestay/calendar?roomId=${r.id}`)"
        />
      </template>
    </view>

    <view class="homestay__add btn-primary" @tap="go('pages/homestay/room-edit')">{{ tr("新增房间") }}</view>
  </view>
</template>

<style lang="scss" scoped>
.homestay {
  min-height: 100vh;
  padding-bottom: 160rpx;
  background: $bg;
}

.homestay__sum {
  display: flex;
  align-items: center;
  margin: 24rpx 24rpx 0;
  padding: 28rpx 0;
  border-radius: $radius-lg;
  background: linear-gradient(135deg, var(--qm-soft, #eaf0ec), var(--qm-soft-2, #f3f6f4));
}

.homestay__sum-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.homestay__sum-num {
  font-size: 40rpx;
  font-weight: 800;
  color: $green;

  &--sm {
    font-size: 30rpx;
    line-height: 56rpx;
  }
}

.homestay__sum-label {
  font-size: 22rpx;
  color: $text-sub;
}

.homestay__sum-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(79, 143, 82, 0.2);
}

.homestay__list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.homestay__add {
  position: fixed;
  left: 50%;
  right: auto;
  bottom: 0;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  border-radius: 0;
  height: 100rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -6rpx 24rpx rgba(38, 53, 42, 0.08);
}
</style>
