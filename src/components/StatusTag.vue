<script setup lang="ts">
import { computed } from "vue";
import { tr } from "@/utils/i18n";
import {
  ORDER_STATUS_TEXT,
  PICKING_STATUS_TEXT,
  PRODUCT_STATUS_TEXT,
  ROOM_STATUS_TEXT,
} from "@/utils/constants";

type Kind = "order" | "picking" | "product" | "room";

const props = withDefaults(
  defineProps<{
    status: string;
    kind: Kind;
  }>(),
  { kind: "order" },
);

const TEXT_MAP: Record<Kind, Record<string, string>> = {
  order: ORDER_STATUS_TEXT,
  picking: PICKING_STATUS_TEXT,
  product: PRODUCT_STATUS_TEXT,
  room: ROOM_STATUS_TEXT,
};

const text = computed(() => tr(TEXT_MAP[props.kind][props.status] ?? props.status));

// tone 决定配色：green 绿 / warning 橙 / danger 红 / info 灰
const tone = computed(() => {
  const s = props.status;
  if (props.kind === "order") {
    if (s === "COMPLETED") return "green";
    if (s === "WAIT_VERIFY" || s === "WAIT_SHIP" || s === "SHIPPING") return "warning";
    if (s === "REFUNDING" || s === "REFUND_REJECTED") return "danger";
    return "info";
  }
  if (props.kind === "picking") {
    if (s === "PUBLISHED") return "green";
    if (s === "FULL") return "danger";
    return "info";
  }
  if (props.kind === "product") {
    return s === "ON_SALE" ? "green" : "info";
  }
  if (props.kind === "room") {
    if (s === "OPEN") return "green";
    if (s === "MAINTENANCE") return "warning";
    if (s === "FULL") return "danger";
    return "info";
  }
  return "info";
});
</script>

<template>
  <text class="tag" :class="`tag--${tone}`">{{ text }}</text>
</template>

<style lang="scss" scoped>
.tag {
  display: inline-flex;
  align-items: center;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 22rpx;
  line-height: 1.6;

  &--green {
    background: var(--qm-success-bg, rgba(63, 107, 76, 0.12));
    color: var(--qm-success, #3f6b4c);
  }

  &--warning {
    background: var(--qm-warning-bg, #f6ecd6);
    color: var(--qm-warning, #a97a2c);
  }

  &--danger {
    background: var(--qm-danger-bg, #f5e3dd);
    color: var(--qm-danger, #a8422f);
  }

  &--info {
    background: var(--qm-info-bg, #eeeadf);
    color: var(--qm-info, #6b7268);
  }
}
</style>
