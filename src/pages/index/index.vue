<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useAppStore } from "@/stores/app";
import { useMerchantStore } from "@/stores/merchant";
import { useRequest } from "@/composables/useRequest";
import { usePolling } from "@/composables/usePolling";
import { getDashboard } from "@/api/statistics";
import { getUnreadCount } from "@/api/message";
import { formatMoney } from "@/utils/format";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import MerchantTabBar from "@/components/MerchantTabBar.vue";
import QuickAction, { type QuickItem } from "@/components/QuickAction.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

const appStore = useAppStore();
const merchantStore = useMerchantStore();
const unread = ref(0);
const statusSaving = ref(false);

const { data, run } = useRequest(() => getDashboard().then((r) => r.data));

const status = computed(() => merchantStore.merchantInfo?.status || "OPEN");

const quickActions: QuickItem[] = [
  { key: "picking", label: tr("新增场次"), icon: "/static/icons/icon-leaf-green.svg", path: "pages/picking/create" },
  { key: "room", label: tr("房间管理"), icon: "/static/icons/icon-house-green.svg", path: "pages/homestay/index" },
  { key: "product", label: tr("商品管理"), icon: "/static/icons/icon-bag-green.svg", path: "pages/product/index" },
  { key: "verify", label: tr("订单核销"), icon: "/static/icons/icon-scan-green.svg", path: "pages/order/verify" },
  { key: "settle", label: tr("结算提现"), icon: "/static/icons/icon-coin-green.svg", path: "pages/settlement/index" },
  { key: "stat", label: tr("经营数据"), icon: "/static/icons/icon-chart-green.svg", path: "pages/statistics/index" },
];

/** 部分快捷入口只对特定类型商户有意义：1=果园/农货，2=民宿 */
const QUICK_ACTION_TYPES: Record<string, number[]> = { picking: [1], room: [2] };

const visibleQuickActions = computed(() => {
  const type = Number((merchantStore.merchantInfo as any)?._raw?.type ?? 1);
  return quickActions.filter(
    (a) => !QUICK_ACTION_TYPES[a.key] || QUICK_ACTION_TYPES[a.key].includes(type),
  );
});

/** 待办只列还有事项的项；营业额/订单是业绩，不放这里，避免与概览重复 */
const pendingTodos = computed(() => (data.value?.todos || []).filter((t) => t.count > 0));
const pendingCount = computed(() => pendingTodos.value.reduce((s, t) => s + t.count, 0));

/** 近 7 日迷你柱状：真实 trend 数据，峰值高亮 */
const trendBars = computed(() => {
  const t = data.value?.trend || [];
  const max = Math.max(...t.map((p) => p.value), 0) || 1;
  return t.map((p) => ({
    pct: `${Math.max(8, Math.round((p.value / max) * 100))}%`,
    isPeak: max > 0 && p.value === max,
  }));
});
const weekTotal = computed(() => (data.value?.trend || []).reduce((s, p) => s + p.value, 0));

async function onStatusToggle() {
  if (statusSaving.value) return;
  const next = status.value === "CLOSED" ? "OPEN" : "CLOSED";
  statusSaving.value = true;
  const ok = await merchantStore.updateStatus(next);
  statusSaving.value = false;
  uni.showToast({
    title: ok ? (next === "OPEN" ? tr("已切换为营业中") : tr("已暂停营业")) : tr("状态未更新，请重试"),
    icon: "none",
  });
}

function refresh() {
  run();
  getUnreadCount()
    .then((r) => (unread.value = r.data))
    .catch(() => (unread.value = 0));
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  refresh();
});

// 工作台一直开着也能看到游客刚下的单：30s 静默刷新一次
usePolling(refresh, 30000);

function onQuick(item: QuickItem) {
  go(item.path);
}
</script>

<template>
  <view class="page" :class="qmClass">
    <!-- 顶部商家信息 -->
    <view class="hero" :style="{ paddingTop: appStore.safeAreaTop + 'px' }">
      <view class="hero__content">
        <view class="hero__top">
          <view class="hero__merchant" @tap="go('pages/user/index')">
            <text class="hero__name">{{ merchantStore.merchantInfo?.name || tr("我的店铺") }}</text>
            <text v-if="merchantStore.merchantInfo?.city" class="hero__city">{{ tr(merchantStore.merchantInfo.city) }}</text>
          </view>
          <view class="hero__actions">
            <view class="hero__bell" @tap="go('pages/message/index')">
              <image class="hero__bell-img" src="/static/icons/icon-bell-white.svg" mode="aspectFit" />
              <view v-if="unread > 0" class="hero__badge">{{ unread }}</view>
            </view>
            <view class="hero__scan" @tap="go('pages/order/verify')">
              <image class="hero__scan-img" src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyA3VjVhMiAyIDAgMCAxIDItMmgyIi8+PHBhdGggZD0iTTE3IDNoMmEyIDIgMCAwIDEgMiAydjIiLz48cGF0aCBkPSJNMjEgMTd2MmEyIDIgMCAwIDEtMiAyaC0yIi8+PHBhdGggZD0iTTcgMjFINWEyIDIgMCAwIDEtMi0ydi0yIi8+PGxpbmUgeDE9IjciIHkxPSIxMiIgeDI9IjE3IiB5Mj0iMTIiLz48L3N2Zz4=" mode="aspectFit" />
              <text class="hero__scan-text">{{ tr("扫码核销") }}</text>
            </view>
          </view>
        </view>

        <!-- 营业状态开关：商家高频操作，直接在工作台切换 -->
        <view class="hero__status" :class="{ 'hero__status--off': status === 'CLOSED' }" @tap="onStatusToggle">
          <view class="hero__status-switch"><view class="hero__status-knob" /></view>
          <text class="hero__status-text">{{ status === "CLOSED" ? tr("已暂停营业") : tr("营业中") }}</text>
          <text class="hero__status-hint">{{ tr("点击切换") }}</text>
        </view>
      </view>
    </view>

    <view class="home__body">
      <!-- 今日概览：业绩 -->
      <view class="home__section">
        <text class="home__section-title">{{ tr("今日概览") }}</text>
        <view class="ov card">
          <view class="ov__left">
            <text class="ov__label">{{ tr("今日营业额") }}</text>
            <view class="ov__value">
              <text class="ov__prefix">¥</text>
              <text class="ov__num tnum">{{ data ? formatMoney(data.todayRevenue) : "--" }}</text>
            </view>
            <text class="ov__sub">
              {{ tr("今日") }} {{ data ? data.todayOrders : "--" }} {{ tr("单") }}
              <text v-if="data"> · {{ tr("近7日") }} ¥{{ formatMoney(weekTotal) }}</text>
            </text>
          </view>
          <view class="ov__spark">
            <view class="ov__bars">
              <view
                v-for="(b, i) in trendBars"
                :key="i"
                class="ov__bar"
                :class="{ 'ov__bar--peak': b.isPeak }"
                :style="{ height: b.pct }"
              />
            </view>
            <text class="ov__spark-cap">{{ tr("近 7 日") }}</text>
          </view>
        </view>
      </view>

      <!-- 待办：行动队列 -->
      <view class="home__section">
        <view class="home__section-head">
          <text class="home__section-title">{{ tr("待办事项") }}</text>
          <text v-if="pendingCount > 0" class="home__count">{{ pendingCount }}</text>
        </view>
        <view v-if="pendingTodos.length" class="todo card">
          <view
            v-for="(t, i) in pendingTodos"
            :key="t.key"
            class="todo__row"
            :class="{ 'todo__row--last': i === pendingTodos.length - 1 }"
            @tap="go(t.path)"
          >
            <text class="todo__label">{{ tr(t.label) }}</text>
            <view class="todo__right">
              <text class="todo__count">{{ t.count }}</text>
              <text class="todo__go">{{ tr("去处理") }}</text>
              <text class="todo__arrow">›</text>
            </view>
          </view>
        </view>
        <view v-else class="todo-empty card">
          <text class="todo-empty__mark">✓</text>
          <text class="todo-empty__text">{{ tr("今日暂无待办，先歇口气") }}</text>
        </view>
      </view>

      <!-- 常用功能 -->
      <view class="home__section">
        <text class="home__section-title">{{ tr("常用功能") }}</text>
        <QuickAction :items="visibleQuickActions" @select="onQuick" />
      </view>
    </view>

    <MerchantTabBar current="index" />
  </view>
</template>

<style lang="scss" scoped>
.hero {
  background: linear-gradient(160deg, var(--qm-deep, #1d3f2e) 0%, var(--qm-deep-2, #12291e) 100%);
  padding-bottom: 24rpx;
}

.hero__content {
  padding: 20rpx 32rpx 0;
}

.hero__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.hero__merchant {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}

.hero__name {
  font-size: 42rpx;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: #fff;
}

.hero__city {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.82);
}

.hero__actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.hero__bell {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
}

.hero__bell-img {
  width: 36rpx;
  height: 36rpx;
}

/* 扫码核销：商家到店最高频动作，右上角一键直达 */
.hero__scan {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 64rpx;
  padding: 0 22rpx 0 18rpx;
  border-radius: 999rpx;
  background: var(--qm-accent, #c9db9a);
  box-shadow: 0 10rpx 24rpx -12rpx rgba(0, 0, 0, 0.4);
}

.hero__scan:active {
  transform: scale(0.97);
  opacity: 0.92;
}

.hero__scan-img {
  width: 34rpx;
  height: 34rpx;
  /* 白色图标在浅绿底上改描色：用滤镜转深绿 */
  filter: brightness(0) saturate(100%) invert(28%) sepia(14%) saturate(1200%) hue-rotate(75deg);
}

.hero__scan-text {
  font-size: 24rpx;
  font-weight: 650;
  color: var(--qm-deep, #1d3f2e);
}

.hero__badge {
  position: absolute;
  top: -6rpx;
  right: -4rpx;
  min-width: 30rpx;
  height: 30rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #b2432f;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 营业状态开关 */
.hero__status {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 20rpx;
  padding: 8rpx 22rpx 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.14);
  border: 1rpx solid rgba(255, 255, 255, 0.22);
}

.hero__status-switch {
  width: 60rpx;
  height: 34rpx;
  border-radius: 999rpx;
  background: var(--qm-accent, #c9db9a);
  display: flex;
  align-items: center;
  padding: 0 4rpx;
  transition: background 0.2s $ease;
}

.hero__status-knob {
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  background: #fff;
  transform: translateX(26rpx);
  transition: transform 0.2s $ease;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.hero__status--off .hero__status-switch {
  background: rgba(255, 255, 255, 0.3);
}

.hero__status--off .hero__status-knob {
  transform: translateX(0);
}

.hero__status-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #fff;
}

.hero__status-hint {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

.home__body {
  padding: 24rpx 32rpx calc(184rpx + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.home__section {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.home__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.home__section-title {
  font-size: 30rpx;
  font-weight: 650;
  letter-spacing: -0.01em;
  color: $text-main;
}

.home__count {
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 10rpx;
  border-radius: 18rpx;
  background: $price;
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 今日概览卡 */
.ov {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: 24rpx;
  padding: 26rpx 28rpx;
}

.ov__left {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  min-width: 0;
}

.ov__label {
  font-size: 22rpx;
  letter-spacing: 0.04em;
  color: $text-mute;
}

.ov__value {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}

.ov__prefix {
  font-size: 30rpx;
  font-weight: 600;
  color: $text-main;
}

.ov__num {
  font-family: $font-serif;
  font-size: 68rpx;
  font-weight: 600;
  line-height: 1.05;
  letter-spacing: -0.03em;
  color: $text-main;
}

.ov__sub {
  font-size: 22rpx;
  color: $text-sub;
}

.ov__spark {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
  gap: 10rpx;
  flex-shrink: 0;
}

.ov__bars {
  display: flex;
  align-items: flex-end;
  gap: 6rpx;
  height: 96rpx;
}

.ov__bar {
  width: 12rpx;
  border-radius: 6rpx;
  background: linear-gradient(180deg, var(--qm-primary, #2f5d43) 0%, var(--qm-light, #7a9c86) 100%);
  opacity: 0.3;
}

.ov__bar--peak {
  opacity: 1;
}

.ov__spark-cap {
  font-size: 18rpx;
  color: $text-mute;
}

/* 待办 */
.todo {
  padding: 0 28rpx;
}

.todo__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22rpx 0;
  border-bottom: 1rpx solid $line-2;
}

.todo__row--last {
  border-bottom: none;
}

.todo__label {
  font-size: 28rpx;
  color: $text-main;
}

.todo__right {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.todo__count {
  min-width: 40rpx;
  height: 40rpx;
  padding: 0 10rpx;
  border-radius: 20rpx;
  background: rgba(178, 67, 47, 0.12);
  color: $price;
  font-size: 24rpx;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo__go {
  font-size: 22rpx;
  color: $text-mute;
}

.todo__arrow {
  font-size: 28rpx;
  color: $text-mute;
}

.todo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  padding: 32rpx;
}

.todo-empty__mark {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: rgba(47, 93, 67, 0.12);
  color: $green;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.todo-empty__text {
  font-size: 26rpx;
  color: $text-sub;
}
</style>
