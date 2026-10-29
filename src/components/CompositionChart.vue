<script setup lang="ts">
import { computed, ref } from "vue";
import type { CategoryIncome } from "@/types/business";
import { tr } from "@/utils/i18n";

/**
 * 收入构成（原生绘制）
 *
 * 移动端 3 个以内分类，环形图 + 底部 legend 既占高又一眼看出是默认主题，
 * 这里换成「一条堆叠条 + 明细行」：占比关系更直接，也能看清绝对金额。
 * 超过 3 类归入「其他」，保证主色不超过三档。
 */
const props = defineProps<{ data: CategoryIncome[] }>();

const MAX_SLICES = 3;

const rows = computed(() => {
  const list = (props.data ?? [])
    .map((d) => ({ name: String(d.name ?? ""), value: Number.isFinite(Number(d.value)) ? Number(d.value) : 0 }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  if (list.length <= MAX_SLICES) return list;
  const head = list.slice(0, MAX_SLICES - 1);
  const rest = list.slice(MAX_SLICES - 1).reduce((s, d) => s + d.value, 0);
  return [...head, { name: "其他", value: rest }];
});

const total = computed(() => rows.value.reduce((s, d) => s + d.value, 0));

const slices = computed(() =>
  rows.value.map((d, i) => ({
    ...d,
    pct: total.value ? (d.value / total.value) * 100 : 0,
    width: total.value ? `${Math.max(2, (d.value / total.value) * 100)}%` : "0%",
    tone: `c${i + 1}`,
  })),
);

const active = ref(-1);

function toggle(i: number) {
  active.value = active.value === i ? -1 : i;
}

function money(v: number) {
  return (v ?? 0).toLocaleString("zh-CN", { maximumFractionDigits: 0 });
}

function pctText(v: number) {
  return `${v >= 10 ? Math.round(v) : v.toFixed(1)}%`;
}
</script>

<template>
  <view class="comp">
    <view v-if="!total" class="comp__empty">
      <text>{{ tr("该区间还没有收入数据") }}</text>
    </view>

    <template v-else>
      <!-- 堆叠条：一屏读完占比，不需要图例对照 -->
      <view class="comp__bar">
        <view
          v-for="(s, i) in slices"
          :key="s.name"
          class="comp__seg"
          :class="[`comp__seg--${s.tone}`, { 'comp__seg--dim': active >= 0 && active !== i }]"
          :style="{ width: s.width }"
          @tap="toggle(i)"
        />
      </view>

      <view class="comp__rows">
        <view
          v-for="(s, i) in slices"
          :key="s.name"
          class="comp__row"
          :class="{ 'comp__row--on': active === i }"
          @tap="toggle(i)"
        >
          <view class="comp__dot" :class="`comp__dot--${s.tone}`" />
          <text class="comp__name">{{ tr(s.name) }}</text>
          <text class="comp__value">¥{{ money(s.value) }}</text>
          <text class="comp__pct">{{ pctText(s.pct) }}</text>
        </view>
      </view>

      <view class="comp__foot">
        <text class="comp__foot-label">{{ tr("合计") }}</text>
        <text class="comp__foot-value">¥{{ money(total) }}</text>
      </view>
    </template>
  </view>
</template>

<style lang="scss" scoped>
.comp {
  width: 100%;
}

.comp__empty {
  padding: 48rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: var(--qm-text-mute, #8a938b);
}

/* 三档低饱和主色：主题主色 → 主题亮色 → 稻壳色 */
.comp__bar {
  display: flex;
  height: 22rpx;
  border-radius: 999rpx;
  overflow: hidden;
  background: var(--qm-soft-2, #f3f6f4);
}

.comp__seg {
  height: 100%;
  transition: opacity 0.2s $ease;
}

.comp__seg--c1 {
  background: var(--qm-primary, #2f5d43);
}

.comp__seg--c2 {
  background: var(--qm-light, #7a9c86);
}

.comp__seg--c3 {
  background: var(--qm-yellow, #cdb98a);
}

.comp__seg--dim {
  opacity: 0.3;
}

.comp__rows {
  margin-top: 22rpx;
  display: flex;
  flex-direction: column;
}

.comp__row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 0;
  border-bottom: 1rpx solid var(--qm-line-2, rgba(27, 36, 29, 0.06));

  &:last-child {
    border-bottom: none;
  }
}

.comp__dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.comp__dot--c1 {
  background: var(--qm-primary, #2f5d43);
}

.comp__dot--c2 {
  background: var(--qm-light, #7a9c86);
}

.comp__dot--c3 {
  background: var(--qm-yellow, #cdb98a);
}

.comp__name {
  flex: 1;
  min-width: 0;
  font-size: 26rpx;
  color: var(--qm-text-main, #1b241d);
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.comp__value {
  font-size: 26rpx;
  font-weight: 600;
  color: var(--qm-text-main, #1b241d);
  font-variant-numeric: tabular-nums;
}

.comp__pct {
  width: 92rpx;
  text-align: right;
  font-size: 22rpx;
  color: var(--qm-text-mute, #8a938b);
  font-variant-numeric: tabular-nums;
}

.comp__row--on .comp__pct {
  color: var(--qm-primary, #2f5d43);
  font-weight: 600;
}

.comp__foot {
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid var(--qm-line, rgba(27, 36, 29, 0.1));
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.comp__foot-label {
  font-size: 22rpx;
  color: var(--qm-text-mute, #8a938b);
}

.comp__foot-value {
  font-family: $font-serif;
  font-size: 34rpx;
  font-weight: 600;
  color: var(--qm-text-main, #1b241d);
}
</style>
