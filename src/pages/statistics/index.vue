<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { useRequest } from "@/composables/useRequest";
import { getStatistics } from "@/api/statistics";
import { formatMoney } from "@/utils/format";
import { tr } from "@/utils/i18n";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import MerchantTabBar from "@/components/MerchantTabBar.vue";
import StatisticCard from "@/components/StatisticCard.vue";
import TrendChart from "@/components/TrendChart.vue";
import CompositionChart from "@/components/CompositionChart.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

const ranges = [
  { label: "今日", value: "today" },
  { label: "本周", value: "week" },
  { label: "本月", value: "month" },
  { label: "全部", value: "all" },
];

const range = ref("today");

const { loading, error, data, run } = useRequest(() =>
  getStatistics(range.value).then((r) => r.data),
);

/**
 * 统计卡：不再使用写死的涨跌百分比。
 * 后端 summary 接口只返回区间汇总值，没有同比数据，因此这里改为展示
 * 「真实派生指标」，避免出现与数据脱节的假涨跌。
 */
const cards = computed(() => {
  const d = data.value;
  if (!d) {
    return [
      { label: "营业额", value: "--", delta: "", deltaType: "flat" as const },
      { label: "订单量", value: "--", delta: "", deltaType: "flat" as const },
      { label: "核销量", value: "--", delta: "", deltaType: "flat" as const },
      { label: "退款金额", value: "--", delta: "", deltaType: "flat" as const },
    ];
  }
  // 客单价 = 营业额 / 订单量（订单量为 0 时展示 --
  const avg = d.orderCount > 0 ? d.revenue / d.orderCount : 0;
  // 核销率 = 核销量 / 订单量
  const verifyRate = d.orderCount > 0 ? (d.verifyCount / d.orderCount) * 100 : 0;
  // 退款率 = 退款金额 / 营业额
  const refundRate = d.revenue > 0 ? (d.refundAmount / d.revenue) * 100 : 0;
  return [
    { label: "营业额", value: "¥" + formatMoney(d.revenue), delta: tr("客单价 ¥{amount}").replace("{amount}", formatMoney(avg)), deltaType: "flat" as const },
    { label: "订单量", value: String(d.orderCount), delta: tr("核销率 {rate}%").replace("{rate}", verifyRate.toFixed(1)), deltaType: "up" as const },
    { label: "核销量", value: String(d.verifyCount), delta: tr("待核销 {n}").replace("{n}", String(d.waitVerify)), deltaType: "flat" as const },
    { label: "退款金额", value: "¥" + formatMoney(d.refundAmount), delta: tr("退款率 {rate}%").replace("{rate}", refundRate.toFixed(1)), deltaType: refundRate > 0 ? ("down" as const) : ("flat" as const) },
  ];
});

/** 是否有可展示的数据（营业额定/订单量任一非 0） */
const hasData = computed(() => {
  const d = data.value;
  if (!d) return false;
  return d.revenue > 0 || d.orderCount > 0 || d.verifyCount > 0 || d.refundAmount > 0;
});

function onRange(v: string) {
  if (v === range.value) return;
  range.value = v;
  run();
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  run();
});
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('经营概览')" />

    <view class="statistics__body">
      <view class="statistics__range">
        <view
          v-for="r in ranges"
          :key="r.value"
          class="statistics__range-item"
          :class="{ active: range === r.value }"
          @tap="onRange(r.value)"
        >
          {{ tr(r.label) }}
        </view>
      </view>

      <LoadingState v-if="loading && !data" :rows="3" />
      <EmptyState
        v-else-if="error"
        :title="tr('加载失败')"
        :description="error"
        :action-text="tr('重新加载')"
        @action="run"
      />

      <template v-else>
        <view class="statistics__cards">
          <StatisticCard
            v-for="(c, i) in cards"
            :key="i"
            :label="tr(c.label)"
            :value="c.value"
            :delta="c.delta"
            :delta-type="c.deltaType"
            :accent="i === 0"
          />
        </view>

        <EmptyState
          v-if="!hasData"
          :title="tr('当前区间暂无经营数据')"
          :description="tr('换个时间区间看看，或等待新的订单产生')"
        />

        <template v-else>
          <view class="statistics__chart card">
            <text class="statistics__chart-title">{{ tr("营业额趋势") }}</text>
            <TrendChart v-if="data" :data="data.revenueTrend" plot-height="260rpx" />
          </view>

          <view class="statistics__chart card">
            <text class="statistics__chart-title">{{ tr("收入构成") }}</text>
            <CompositionChart v-if="data" :data="data.categoryIncome" />
          </view>
        </template>
      </template>
    </view>

    <MerchantTabBar current="statistics" />
  </view>
</template>

<style lang="scss" scoped>
.statistics__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.statistics__range {
  display: flex;
  gap: 12rpx;
}

.statistics__range-item {
  flex: 1;
  height: 68rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: $surface;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.statistics__cards {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.statistics__cards :deep(.stat) {
  width: calc((100% - 20rpx) / 2);
}

.statistics__chart {
  padding: 24rpx;
}

.statistics__chart-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
  margin-bottom: 16rpx;
}
</style>
