<script setup lang="ts">
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { getReviews, replyReview, type MerchantReview } from "@/api/review";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

const qmClass = useQmClass();
const loading = ref(true);
const list = ref<MerchantReview[]>([]);
const replying = ref<MerchantReview | null>(null);
const replyText = ref("");
const sending = ref(false);

const TYPE_TEXT: Record<number, string> = { 1: "采摘", 2: "民宿", 3: "商品" };

async function load() {
  loading.value = true;
  try {
    const res = await getReviews(1, 30);
    list.value = res.data?.list ?? [];
  } catch {
    list.value = [];
  } finally {
    loading.value = false;
  }
}

function openReply(r: MerchantReview) {
  replying.value = r;
  replyText.value = r.reply || "";
}

async function onSend() {
  const target = replying.value;
  if (!target || sending.value) return;
  if (!replyText.value.trim()) {
    uni.showToast({ title: tr("回复内容不能为空"), icon: "none" });
    return;
  }
  sending.value = true;
  const res = await replyReview(target.id, replyText.value.trim());
  sending.value = false;
  if (!res.data) {
    uni.showToast({ title: res.message || tr("回复失败"), icon: "none" });
    return;
  }
  replying.value = null;
  uni.showToast({ title: tr("已回复"), icon: "success" });
  load();
}

onShow(() => {
  load();
});
</script>

<template>
  <view class="rv" :class="qmClass">
    <MerchantNavbar :title="tr('游客评价')" show-back show-home />

    <LoadingState v-if="loading" :rows="3" />
    <EmptyState v-else-if="!list.length" :title="tr('还没有评价')" :description="tr('订单完成后游客的评价会出现在这里')" />

    <view v-else class="rv__list">
      <view v-for="r in list" :key="r.id" class="rv__item card">
        <view class="rv__head">
          <text class="rv__stars">{{ "★".repeat(r.score) }}{{ "☆".repeat(5 - r.score) }}</text>
          <text class="rv__type">{{ tr(TYPE_TEXT[r.type] || "订单") }}</text>
        </view>
        <text class="rv__content">{{ r.content || tr("用户未填写文字") }}</text>
        <text class="rv__time">{{ (r.createTime || "").slice(0, 16) }}</text>

        <view v-if="r.reply" class="rv__reply">
          <text class="rv__reply-label">{{ tr("商家回复") }}</text>
          <text class="rv__reply-text">{{ r.reply }}</text>
        </view>
        <view class="rv__action" @tap="openReply(r)">
          <text>{{ r.reply ? tr("修改回复") : tr("回复评价") }}</text>
        </view>
      </view>
    </view>

    <view v-if="replying" class="rv__mask" @tap="replying = null">
      <view class="rv__sheet" @tap.stop>
        <text class="rv__sheet-title">{{ tr("回复评价") }}</text>
        <textarea class="rv__sheet-input" v-model="replyText" :maxlength="200" :placeholder="tr('感谢语或说明，会展示给其他游客')" />
        <view class="rv__sheet-row">
          <view class="rv__sheet-cancel" @tap="replying = null">{{ tr("取消") }}</view>
          <view class="rv__sheet-send" @tap="onSend">{{ tr("发送") }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.rv {
  min-height: 100vh;
  background: $bg;
}

.rv__list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.rv__item {
  padding: 24rpx;
}

.rv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.rv__stars {
  font-size: 26rpx;
  color: $yellow;
}

.rv__type {
  font-size: 22rpx;
  color: $green;
  background: $green-bg;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.rv__content {
  display: block;
  margin-top: 12rpx;
  font-size: 26rpx;
  color: $text-main;
  line-height: 1.7;
}

.rv__time {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: $text-mute;
}

.rv__reply {
  margin-top: 16rpx;
  padding: 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
}

.rv__reply-label {
  display: block;
  font-size: 22rpx;
  color: $green;
  font-weight: 600;
}

.rv__reply-text {
  display: block;
  margin-top: 6rpx;
  font-size: 24rpx;
  color: $text-sub;
  line-height: 1.6;
}

.rv__action {
  margin-top: 16rpx;
  align-self: flex-start;
  padding: 10rpx 28rpx;
  border-radius: 999rpx;
  border: 1rpx solid $line-strong;
  font-size: 24rpx;
  color: $text-sub;
}

.rv__mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  z-index: 99;
  /* #ifdef H5 */
  left: 50%;
  right: auto;
  width: 100%;
  max-width: $app-max-width;
  transform: translateX(-50%);
  /* #endif */
}

.rv__sheet {
  width: 100%;
  padding: 32rpx 32rpx 48rpx;
  border-radius: 32rpx 32rpx 0 0;
  background: $surface;
}

.rv__sheet-title {
  display: block;
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
}

.rv__sheet-input {
  width: 100%;
  height: 200rpx;
  margin-top: 20rpx;
  padding: 16rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 26rpx;
}

.rv__sheet-row {
  margin-top: 20rpx;
  display: flex;
  gap: 20rpx;
}

.rv__sheet-cancel,
.rv__sheet-send {
  flex: 1;
  height: 80rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26rpx;
}

.rv__sheet-cancel {
  border: 1rpx solid $line-strong;
  color: $text-sub;
}

.rv__sheet-send {
  background: $green;
  color: #f7f3e6;
}
</style>
