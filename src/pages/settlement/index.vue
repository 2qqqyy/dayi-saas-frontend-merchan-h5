<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow, onReachBottom } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import {
  getSettlements,
  getWithdrawals,
  getSettlementOverview,
  SETTLEMENT_STATUS_LABEL,
  WITHDRAWAL_STATUS_LABEL,
  withdrawalStatusTone,
  dateOnly,
  type SettlementOverview,
} from "@/api/settlement";
import type { SettlementItem, WithdrawalItem } from "@/types/business";
import { formatMoney } from "@/utils/format";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

/* ---- 状态 ---- */
const tab = ref<"settle" | "withdraw">("settle");
const loading = ref(false);
const error = ref("");
const overview = ref<SettlementOverview | null>(null);
const settlements = ref<SettlementItem[]>([]);
const withdrawals = ref<WithdrawalItem[]>([]);
const settlePage = ref(1);
const withdrawPage = ref(1);
const settleTotal = ref(0);
const withdrawTotal = ref(0);
const loadingMore = ref(false);

const PAGE_SIZE = 10;

/** 待结算金额（可提现） */
const pendingAmount = computed(() => overview.value?.pendingAmount ?? 0);
const withdrawnAmount = computed(() => overview.value?.withdrawnAmount ?? 0);
const totalSales = computed(() => overview.value?.totalSales ?? 0);
const canWithdraw = computed(() => pendingAmount.value > 0);

/** 结算记录是否已加载到末尾 */
const settleFinished = computed(
  () => !loadingMore.value && settlements.value.length >= settleTotal.value,
);
const withdrawFinished = computed(
  () => !loadingMore.value && withdrawals.value.length >= withdrawTotal.value,
);

/** 银行卡号脱敏：6217 **** **** 1234 */
function maskCard(no: string): string {
  const s = String(no || "").replace(/\s/g, "");
  if (!s) return tr("未绑定");
  if (s.length <= 8) return s;
  return `${s.slice(0, 4)} **** **** ${s.slice(-4)}`;
}

async function loadOverview() {
  try {
    const r = await getSettlementOverview();
    overview.value = r.data;
  } catch {
    // 概览失败不阻塞列表展示
    overview.value = null;
  }
}

async function loadSettlements(reset = true) {
  if (reset) {
    settlePage.value = 1;
    settlements.value = [];
  }
  const r = await getSettlements(settlePage.value, PAGE_SIZE);
  const list = r.data.list;
  settlements.value = reset ? list : [...settlements.value, ...list];
  settleTotal.value = r.data.total;
}

async function loadWithdrawals(reset = true) {
  if (reset) {
    withdrawPage.value = 1;
    withdrawals.value = [];
  }
  const r = await getWithdrawals(withdrawPage.value, PAGE_SIZE);
  const list = r.data.list;
  withdrawals.value = reset ? list : [...withdrawals.value, ...list];
  withdrawTotal.value = r.data.total;
}

async function load(reset = true) {
  loading.value = true;
  error.value = "";
  try {
    await Promise.all([loadOverview(), loadSettlements(reset), loadWithdrawals(reset)]);
  } catch (e: any) {
    error.value = e?.message || tr("加载失败，请稍后重试");
  } finally {
    loading.value = false;
  }
}

function onTab(t: "settle" | "withdraw") {
  if (t === tab.value) return;
  tab.value = t;
}

function onApplyWithdraw() {
  if (!canWithdraw.value) {
    uni.showToast({ title: tr("暂无可提现余额"), icon: "none" });
    return;
  }
  go("pages/settlement/withdraw");
}

/** 触底加载更多 */
function loadMore() {
  if (loadingMore.value || loading.value) return;
  if (tab.value === "settle") {
    if (settleFinished.value) return;
    loadingMore.value = true;
    settlePage.value += 1;
    loadSettlements(false).finally(() => (loadingMore.value = false));
  } else {
    if (withdrawFinished.value) return;
    loadingMore.value = true;
    withdrawPage.value += 1;
    loadWithdrawals(false).finally(() => (loadingMore.value = false));
  }
}

/** uni-app 页面级触底回调 */
onReachBottom(loadMore);

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  load();
});
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('结算中心')" show-back show-home />

    <view class="settle__body">
      <!-- 余额概览 -->
      <view class="settle__hero">
        <text class="settle__hero-label">{{ tr("可提现余额（元）") }}</text>
        <view class="settle__hero-amount">
          <text class="settle__hero-symbol">¥</text>
          <text class="settle__hero-value">{{ formatMoney(pendingAmount) }}</text>
        </view>
        <view class="settle__hero-meta">
          <view class="settle__hero-meta-item">
            <text class="settle__hero-meta-label">{{ tr("累计销售额") }}</text>
            <text class="settle__hero-meta-value">¥{{ formatMoney(totalSales) }}</text>
          </view>
          <view class="settle__hero-divider" />
          <view class="settle__hero-meta-item">
            <text class="settle__hero-meta-label">{{ tr("已提现") }}</text>
            <text class="settle__hero-meta-value">¥{{ formatMoney(withdrawnAmount) }}</text>
          </view>
        </view>
        <view
          class="settle__withdraw-btn"
          :class="canWithdraw ? '' : 'settle__withdraw-btn--disabled'"
          @tap="onApplyWithdraw"
        >
          {{ canWithdraw ? tr("申请提现") : tr("暂无可提现余额") }}
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="settle__tabs">
        <view
          class="settle__tab"
          :class="{ 'settle__tab--active': tab === 'settle' }"
          @tap="onTab('settle')"
        >
          {{ tr("结算明细") }}
          <text v-if="settleTotal" class="settle__tab-count">{{ settleTotal }}</text>
        </view>
        <view
          class="settle__tab"
          :class="{ 'settle__tab--active': tab === 'withdraw' }"
          @tap="onTab('withdraw')"
        >
          {{ tr("提现记录") }}
          <text v-if="withdrawTotal" class="settle__tab-count">{{ withdrawTotal }}</text>
        </view>
      </view>

      <LoadingState v-if="loading && !settlements.length && !withdrawals.length" :rows="3" />
      <EmptyState
        v-else-if="error"
        :title="tr('加载失败')"
        :description="error"
        :action-text="tr('重新加载')"
        @action="load()"
      />

      <template v-else>
        <!-- 结算明细 -->
        <template v-if="tab === 'settle'">
          <EmptyState
            v-if="!settlements.length"
            :title="tr('暂无结算记录')"
            :description="tr('订单完成后将自动生成结算单')"
          />
          <view v-else class="settle__list">
            <view v-for="it in settlements" :key="it.id" class="settle__item card">
              <view class="settle__item-head">
                <text class="settle__item-no">{{ tr("订单号") }} {{ it.orderNo || it.orderId }}</text>
                <text
                  class="settle__tag"
                  :class="it.status === 'SETTLED' ? 'settle__tag--ok' : 'settle__tag--warn'"
                >
                  {{ tr(SETTLEMENT_STATUS_LABEL[it.status]) }}
                </text>
              </view>
              <view class="settle__item-rows">
                <view class="settle__item-row">
                  <text class="settle__item-k">{{ tr("订单金额") }}</text>
                  <text class="settle__item-v">¥{{ formatMoney(it.orderAmount) }}</text>
                </view>
                <view class="settle__item-row">
                  <text class="settle__item-k">{{ tr("平台佣金") }}（{{ (it.commissionRate * 100).toFixed(0) }}%）</text>
                  <text class="settle__item-v settle__item-v--sub">-¥{{ formatMoney(it.commissionAmount) }}</text>
                </view>
              </view>
              <view class="settle__item-foot">
                <text class="settle__item-date">{{ dateOnly(it.createdAt) }}</text>
                <view class="settle__item-total">
                  <text class="settle__item-total-k">{{ tr("结算金额") }}</text>
                  <text class="settle__item-total-v">¥{{ formatMoney(it.settleAmount) }}</text>
                </view>
              </view>
            </view>
          </view>
        </template>

        <!-- 提现记录 -->
        <template v-else>
          <EmptyState
            v-if="!withdrawals.length"
            :title="tr('暂无提现记录')"
            :description="tr('结算完成后即可申请提现')"
          />
          <view v-else class="settle__list">
            <view v-for="w in withdrawals" :key="w.id" class="settle__item card">
              <view class="settle__item-head">
                <text class="settle__item-no">{{ tr("提现单") }} {{ w.id }}</text>
                <text class="settle__tag" :class="`settle__tag--${withdrawalStatusTone(w.status)}`">
                  {{ tr(WITHDRAWAL_STATUS_LABEL[w.status]) }}
                </text>
              </view>
              <view class="settle__item-rows">
                <view class="settle__item-row">
                  <text class="settle__item-k">{{ tr("提现金额") }}</text>
                  <text class="settle__item-v">¥{{ formatMoney(w.amount) }}</text>
                </view>
                <view class="settle__item-row">
                  <text class="settle__item-k">{{ tr("收款账户") }}</text>
                  <text class="settle__item-v settle__item-v--sub">{{ maskCard(w.accountNo) }}</text>
                </view>
                <view class="settle__item-row">
                  <text class="settle__item-k">{{ tr("开户行") }}</text>
                  <text class="settle__item-v settle__item-v--sub">{{ w.bankName || tr("未填写") }}</text>
                </view>
              </view>
              <view class="settle__item-foot">
                <text class="settle__item-date">{{ tr("申请") }} {{ dateOnly(w.createdAt) }}</text>
                <text v-if="w.arrivalDate" class="settle__item-date">{{ tr("到账") }} {{ dateOnly(w.arrivalDate) }}</text>
              </view>
              <view v-if="w.remark" class="settle__item-remark">{{ w.remark }}</view>
            </view>
          </view>
        </template>

        <view v-if="loadingMore" class="settle__more">{{ tr("加载中…") }}</view>
        <view
          v-else-if="
            (tab === 'settle' && settlements.length && settleFinished) ||
            (tab === 'withdraw' && withdrawals.length && withdrawFinished)
          "
          class="settle__more"
        >
          {{ tr("没有更多了") }}
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settle__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

/* ---- 余额卡片 ---- */
.settle__hero {
  position: relative;
  padding: 36rpx 32rpx 32rpx;
  border-radius: $radius-lg;
  background: linear-gradient(140deg, var(--qm-deep, #1d3f2e) 0%, var(--qm-deep-2, #12291e) 100%);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 18rpx 44rpx -26rpx rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.settle__hero-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.settle__hero-amount {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  margin-top: 4rpx;
}

.settle__hero-symbol {
  font-size: 30rpx;
  color: #fff;
  font-weight: 600;
}

.settle__hero-value {
  font-size: 64rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #fff;
  letter-spacing: -1rpx;
}

.settle__hero-meta {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid rgba(255, 255, 255, 0.22);
}

.settle__hero-meta-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.settle__hero-meta-label {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.75);
}

.settle__hero-meta-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #fff;
}

.settle__hero-divider {
  width: 1rpx;
  height: 48rpx;
  background: rgba(255, 255, 255, 0.22);
  margin: 0 24rpx;
}

.settle__withdraw-btn {
  margin-top: 28rpx;
  height: 88rpx;
  border-radius: $radius-lg;
  background: var(--qm-accent, #c9db9a);
  color: var(--qm-deep-2, #12291e);
  font-size: 29rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;

  &--disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.5);
  }

  &:active {
    opacity: 0.9;
  }
}

/* ---- Tab ---- */
.settle__tabs {
  display: flex;
  gap: 12rpx;
  padding: 6rpx;
  background: $green-soft;
  border-radius: $radius-lg;
}

.settle__tab {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border-radius: $radius-md;
  font-size: 26rpx;
  color: $text-sub;

  &--active {
    background: $surface;
    color: $text-main;
    font-weight: 700;
    box-shadow: 0 2rpx 10rpx rgba(38, 53, 42, 0.06);
  }
}

.settle__tab-count {
  font-size: 20rpx;
  color: $text-sub;
}

/* ---- 列表 ---- */
.settle__list {
  display: flex;
  flex-direction: column;
  gap: $space-md;
}

.settle__item {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.settle__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.settle__item-no {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
}

.settle__tag {
  flex-shrink: 0;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;

  &--ok {
    background: var(--qm-soft, #eaf0ec);
    color: var(--qm-primary, #2f5d43);
  }

  &--warn {
    background: #fdf1e3;
    color: #d98a1f;
  }

  &--danger {
    background: var(--qm-danger-bg, #f5e3dd);
    color: var(--qm-danger, #a8422f);
  }
}

.settle__item-rows {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid $line-2;
  border-bottom: 1rpx solid $line-2;
}

.settle__item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.settle__item-k {
  font-size: 25rpx;
  color: $text-sub;
}

.settle__item-v {
  font-size: 26rpx;
  color: $text-main;
  font-weight: 500;

  &--sub {
    color: $text-sub;
    font-weight: 400;
  }
}

.settle__item-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.settle__item-date {
  font-size: 22rpx;
  color: $text-sub;
}

.settle__item-total {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
}

.settle__item-total-k {
  font-size: 22rpx;
  color: $text-sub;
}

.settle__item-total-v {
  font-size: 32rpx;
  font-weight: 700;
  color: $green;
}

.settle__item-remark {
  font-size: 23rpx;
  color: $text-sub;
  line-height: 1.5;
  padding: 12rpx 16rpx;
  background: $bg;
  border-radius: $radius-sm;
}

.settle__more {
  padding: 24rpx;
  text-align: center;
  font-size: 24rpx;
  color: $text-sub;
}
</style>
