<script setup lang="ts">
import { computed, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useRequest } from "@/composables/useRequest";
import { getNoticeDetail, markNoticeRead, NOTICE_CATEGORY_TEXT } from "@/api/notice";
import { go } from "@/utils/navigation";
import { tc, tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

const id = ref("");
const item = ref<Awaited<ReturnType<typeof getNoticeDetail>> | null>(null);

const { loading, error, run } = useRequest(async () => {
  const detail = await getNoticeDetail(id.value);
  item.value = detail;
  // 打开即写 notice_read，商家下次进列表就不会再算未读
  if (!detail.read) markNoticeRead(detail.id).catch(() => {});
});

onLoad((query) => {
  id.value = (query?.id as string) || "";
  if (id.value) run();
});

/** 正文按空行分段，避免整篇挤成一坨 */
const paragraphs = computed(() => {
  const raw = item.value ? tc(item.value.content, item.value.contentEn) : "";
  return raw
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
});
</script>

<template>
  <view class="nd" :class="qmClass">
    <MerchantNavbar :title="tr('公告详情')" show-back show-home />

    <view class="nd__body">
      <LoadingState v-if="loading" :rows="3" />
      <EmptyState
        v-else-if="error || !item"
        :title="tr('公告不存在')"
        :description="error || tr('该公告可能已下架')"
        :action-text="tr('看全部公告')"
        @action="go('pages/notice/index')"
      />
      <template v-else>
        <view class="nd__head">
          <text v-if="item.pinned" class="nd__pin">{{ tr("置顶") }}</text>
          <text class="nd__cat">{{ tr(NOTICE_CATEGORY_TEXT[item.category] || item.category) }}</text>
          <text class="nd__time">{{ item.publishTime }}</text>
        </view>
        <text class="nd__title">{{ tc(item.title, item.titleEn) }}</text>
        <view class="nd__rule" />
        <text v-if="item.summary" class="nd__summary">{{ tc(item.summary, item.summaryEn) }}</text>
        <text v-for="(p, i) in paragraphs" :key="i" class="nd__p">{{ p }}</text>

        <view class="nd__foot">
          <text class="nd__foot-text">{{ tr("内容来自平台公告，如有疑问可在「消息」中查看通知或联系平台客服") }}</text>
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.nd__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.nd__head {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.nd__pin {
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: $green;
  color: #f7f3e6;
  font-size: 20rpx;
}

.nd__cat {
  font-size: 22rpx;
  color: $green;
}

.nd__time {
  font-size: 22rpx;
  color: $text-mute;
}

.nd__title {
  font-family: $font-serif;
  font-size: 42rpx;
  font-weight: 600;
  line-height: 1.35;
  color: $text-main;
}

.nd__rule {
  height: 1rpx;
  background: $line-2;
}

.nd__summary {
  font-size: 27rpx;
  line-height: 1.7;
  color: $text-sub;
}

.nd__p {
  font-size: 28rpx;
  line-height: 1.85;
  color: $text-main;
}

.nd__foot {
  margin-top: 12rpx;
  padding: 22rpx 24rpx;
  border-radius: $radius-md;
  background: $green-soft;
}

.nd__foot-text {
  font-size: 22rpx;
  line-height: 1.6;
  color: $text-sub;
}
</style>
