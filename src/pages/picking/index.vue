<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { usePickingStore } from "@/stores/picking";
import { PICKING_STATUS_TABS } from "@/utils/constants";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import type { PickingSession } from "@/types/business";
import PickingSessionCard from "@/components/PickingSessionCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const pickingStore = usePickingStore();
const active = ref("all");

const list = computed(() => {
  if (active.value === "all") return pickingStore.sessions;
  return pickingStore.sessions.filter((s) => s.status === active.value);
});

function load() {
  pickingStore.fetchSessions(active.value === "all" ? undefined : active.value);
}

function onTab(v: string) {
  active.value = v;
  load();
}

onShow(load);

function onEdit(s: PickingSession) {
  go(`pages/picking/edit?id=${s.id}`);
}

function onDuplicate(s: PickingSession) {
  pickingStore.duplicateSession(s.id).then(() => {
    uni.showToast({ title: tr("已复制为草稿"), icon: "none" });
    load();
  });
}

function onPrimary(s: PickingSession) {
  if (s.status === "DRAFT") {
    pickingStore.publishSession(s.id).then(() => {
      uni.showToast({ title: tr("已发布"), icon: "success" });
      load();
    });
  } else {
    uni.showModal({
      title: tr("关闭场次"),
      content: tr("确定关闭该场次吗？"),
      success: (r) => {
        if (r.confirm) {
          pickingStore.closeSession(s.id).then(() => {
            uni.showToast({ title: tr("已关闭"), icon: "none" });
            load();
          });
        }
      },
    });
  }
}
</script>

<template>
  <view class="picking" :class="qmClass">
    <MerchantNavbar :title="tr('采摘场次')" show-back show-home />
    <view class="picking__tabs">
      <view
        v-for="t in PICKING_STATUS_TABS"
        :key="t.value"
        class="picking__tab"
        :class="{ active: active === t.value }"
        @tap="onTab(t.value)"
      >
        {{ tr(t.label) }}
      </view>
    </view>

    <view class="picking__list">
      <LoadingState v-if="pickingStore.loading" :rows="3" />
      <EmptyState
        v-else-if="!list.length"
        :title="tr('暂无采摘场次')"
        :description="tr('点击下方按钮新增场次')"
      />
      <template v-else>
        <PickingSessionCard
          v-for="s in list"
          :key="s.id"
          :session="s"
          @select="go(`pages/picking/detail?id=${s.id}`)"
          @edit="onEdit(s)"
          @duplicate="onDuplicate(s)"
          @primary="onPrimary(s)"
        />
      </template>
    </view>

    <view class="picking__add btn-primary" @tap="go('pages/picking/create')">{{ tr("新增场次") }}</view>
  </view>
</template>

<style lang="scss" scoped>
.picking {
  min-height: 100vh;
  padding-bottom: 160rpx;
}

.picking__tabs {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  background: $surface;
  position: sticky;
  top: 0;
  z-index: 10;
}

.picking__tab {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: $green-soft;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.picking__list {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.picking__add {
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
}
</style>
