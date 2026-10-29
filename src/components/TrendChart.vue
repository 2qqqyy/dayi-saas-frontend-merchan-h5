<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { TrendPoint } from "@/types/business";
import { tr } from "@/utils/i18n";

/**
 * 营业额趋势（原生绘制，不用 ECharts）
 *
 * 两件事一起解决：
 * 1) ECharts 依赖 document.createElement，小程序里整块画布是空的，原生 view 两端都能渲染；
 * 2) 默认折线主题（粗线+圆点+满屏网格）模板味重，这里按 B 端习惯改成柱状读数：
 *    只保留两条极浅参考线与一条均值虚线，峰值日高亮，点柱子切换读数。
 */
const props = withDefaults(
  defineProps<{
    data: TrendPoint[];
    /** 绘图区高度，不含读数行与日期轴 */
    plotHeight?: string;
  }>(),
  { plotHeight: "220rpx" },
);

const points = computed(() => {
  const rows = (props.data ?? []).map((d) => ({
    date: String(d.date ?? ""),
    value: Number.isFinite(Number(d.value)) ? Number(d.value) : 0,
  }));
  const max = Math.max(...rows.map((r) => r.value), 0);
  // 全 0 时按 1 兜底，避免除零后柱子高度 NaN
  const scale = max > 0 ? max : 1;
  return rows.map((r) => ({
    ...r,
    label: r.date.length >= 10 ? r.date.slice(5) : r.date,
    pct: `${Math.round((r.value / scale) * 100)}%`,
    isPeak: max > 0 && r.value === max,
  }));
});

const total = computed(() => points.value.reduce((s, p) => s + p.value, 0));
const avg = computed(() => (points.value.length ? Math.round(total.value / points.value.length) : 0));
const avgPct = computed(() => {
  const max = Math.max(...points.value.map((p) => p.value), 0) || 1;
  return `${Math.min(96, Math.round((avg.value / max) * 100))}%`;
});

/** 默认停在峰值日：打开就先看到最好的那一天，再手动回看 */
const active = ref(0);
watch(
  points,
  (v) => {
    if (!v.length) return;
    const peak = v.findIndex((p) => p.isPeak);
    active.value = peak >= 0 ? peak : v.length - 1;
  },
  { immediate: true },
);

const current = computed(() => points.value[active.value]);

function pick(i: number) {
  active.value = i;
}

function money(v: number) {
  return (v ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}
</script>

<template>
  <view class="trend">
    <!-- 读数行：日期 + 金额 + 日均/峰值，替代 ECharts 的浮层 tooltip -->
    <view class="trend__readout">
      <view class="trend__readout-main">
        <text class="trend__readout-date">{{ current?.label || "--" }}</text>
        <text class="trend__readout-value">¥{{ money(current?.value ?? 0) }}</text>
      </view>
      <text class="trend__readout-meta">
        {{ tr("日均") }} ¥{{ money(avg) }} · {{ tr("合计") }} ¥{{ money(total) }}
      </text>
    </view>

    <view class="trend__plot" :style="{ height: plotHeight }">
      <view class="trend__guide" />
      <view class="trend__guide trend__guide--mid" />
      <view v-if="total > 0" class="trend__avg" :style="{ bottom: avgPct }">
        <text class="trend__avg-text">{{ tr("均值") }}</text>
      </view>

      <view
        v-for="(p, i) in points"
        :key="p.date || i"
        class="trend__col"
        :class="{ 'trend__col--on': i === active }"
        @tap="pick(i)"
      >
        <view
          class="trend__bar"
          :class="{ 'trend__bar--peak': p.isPeak }"
          :style="{ height: p.pct }"
        />
      </view>
    </view>

    <view class="trend__axis">
      <text
        v-for="(p, i) in points"
        :key="p.date || i"
        class="trend__axis-text"
        :class="{ 'trend__axis-text--on': i === active }"
      >{{ p.label }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.trend {
  width: 100%;
}

.trend__readout {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6rpx 16rpx;
  margin-bottom: 18rpx;
}

.trend__readout-main {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
}

.trend__readout-date {
  font-size: 22rpx;
  color: var(--qm-text-mute, #8a938b);
}

.trend__readout-value {
  font-family: $font-serif;
  font-size: 40rpx;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--qm-text-main, #1b241d);
}

.trend__readout-meta {
  font-size: 21rpx;
  color: var(--qm-text-mute, #8a938b);
}

.trend__plot {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 10rpx;
  padding-top: 8rpx;
}

/* 只留两条极浅参考线，代替 ECharts 默认的密集网格 */
.trend__guide {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  border-top: 1rpx solid var(--qm-line-2, rgba(27, 36, 29, 0.06));
}

.trend__guide--mid {
  top: 50%;
}

.trend__avg {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1rpx dashed var(--qm-line-strong, rgba(27, 36, 29, 0.18));
}

.trend__avg-text {
  position: absolute;
  left: 0;
  top: -26rpx;
  font-size: 18rpx;
  color: var(--qm-text-mute, #8a938b);
}

.trend__col {
  position: relative;
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  /* 点击热区比柱子本身宽，手指好点 */
}

.trend__bar {
  width: 58%;
  max-width: 44rpx;
  min-height: 6rpx;
  border-radius: 6rpx 6rpx 3rpx 3rpx;
  background: linear-gradient(180deg, var(--qm-primary, #2f5d43) 0%, var(--qm-light, #7a9c86) 100%);
  opacity: 0.26;
  transition: opacity 0.24s $ease, transform 0.24s $ease;
}

.trend__bar--peak {
  opacity: 0.55;
}

.trend__col--on .trend__bar {
  opacity: 1;
  box-shadow: 0 -8rpx 22rpx -10rpx var(--qm-deep, #1d3f2e);
}

.trend__axis {
  display: flex;
  gap: 10rpx;
  margin-top: 14rpx;
}

.trend__axis-text {
  flex: 1;
  text-align: center;
  font-size: 19rpx;
  color: var(--qm-text-mute, #8a938b);
}

.trend__axis-text--on {
  color: var(--qm-primary, #2f5d43);
  font-weight: 600;
}
</style>
