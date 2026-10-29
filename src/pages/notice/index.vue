<script setup lang="ts">
import { computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { useRequest } from "@/composables/useRequest";
import { getNotices, NOTICE_CATEGORY_TEXT } from "@/api/notice";
import { go } from "@/utils/navigation";
import { tc, tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

const merchantStore = useMerchantStore();

const { loading, error, data, run } = useRequest(() => getNotices());

const list = computed(() => data.value ?? []);
const unread = computed(() => list.value.filter((n) => !n.read).length);

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  run();
});
</script>

<template>
  <view class="notice" :class="qmClass">
    <MerchantNavbar :title="tr('平台公告')" :subtitle="tr('结算、规则与上线说明，由平台发布')" show-back show-home />

    <view class="notice__body">
      <LoadingState v-if="loading" :rows="3" />
      <EmptyState
        v-else-if="error"
        :title="tr('加载失败')"
        :description="error"
        :action-text="tr('重新加载')"
        @action="run"
      />
      <EmptyState v-else-if="!list.length" :title="tr('暂无公告')" :description="tr('平台公告会出现在这里')" />
      <template v-else>
        <view class="notice__lede">
          <text class="notice__lede-main">{{ tr("共 {n} 条公告").replace("{n}", String(list.length)) }}</text>
          <text v-if="unread" class="notice__lede-unread">{{ tr("{n} 条未读").replace("{n}", String(unread)) }}</text>
        </view>
        <view
          v-for="n in list"
          :key="n.id"
          class="notice__item card"
          @tap="go('pages/notice/detail?id=' + n.id)"
        >
          <view class="notice__head">
            <text v-if="n.pinned" class="notice__pin">{{ tr("置顶") }}</text>
            <text class="notice__cat">{{ tr(NOTICE_CATEGORY_TEXT[n.category] || n.category) }}</text>
            <view v-if="!n.read" class="notice__dot" />
          </view>
          <text class="notice__title" :class="{ 'notice__title--read': n.read }">{{ tc(n.title, n.titleEn) }}</text>
          <text v-if="n.summary" class="notice__summary">{{ tc(n.summary, n.summaryEn) }}</text>
          <text class="notice__time">{{ n.publishTime }}</text>
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.notice__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.notice__lede {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8rpx 4rpx;
}

.notice__lede-main {
  font-size: 24rpx;
  color: $text-sub;
}

.notice__lede-unread {
  font-size: 24rpx;
  color: $green;
  font-weight: 600;
}

.notice__item {
  padding: 26rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.notice__head {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.notice__pin {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 20rpx;
  letter-spacing: 0.04em;
}

.notice__cat {
  font-size: 22rpx;
  color: $text-sub;
}

.notice__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: $price;
}

.notice__title {
  font-family: $font-serif;
  font-size: 32rpx;
  font-weight: 600;
  line-height: 1.45;
  color: $text-main;
}

.notice__title--read {
  color: $text-sub;
  font-weight: 500;
}

.notice__summary {
  font-size: 25rpx;
  line-height: 1.6;
  color: $text-sub;
}

.notice__time {
  font-size: 22rpx;
  color: $text-mute;
}
</style>
