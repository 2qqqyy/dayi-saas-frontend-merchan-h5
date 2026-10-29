<script setup lang="ts">
import { computed } from "vue";
import type { Order } from "@/types/business";
import { formatMoney } from "@/utils/format";
import { tr } from "@/utils/i18n";
import StatusTag from "@/components/StatusTag.vue";

const props = defineProps<{ order: Order }>();

const emit = defineEmits<{
  (e: "select"): void;
  (e: "action"): void;
}>();

const typeText = computed(() => {
  if (props.order.type === "PICKING") return "采摘订单";
  if (props.order.type === "HOMESTAY") return "民宿订单";
  return "商城订单";
});

const summary = computed(() => {
  const o = props.order;
  if (o.type === "PICKING") {
    // dashboard 等聚合接口不下发 pickDate/peopleNum，细分字段缺失时回退到后端 subtitle，
    // 避免渲染出 "undefined undefined · undefined人"
    const when = [o.sessionDate, o.sessionTime].filter(Boolean).join(" ");
    const people = o.people != null ? `${o.people}人` : "";
    const parts = [o.orchardName, when || "", people].filter(Boolean);
    if (when || people) return parts.join(" · ");
    return [o.orchardName, o.subtitle].filter(Boolean).join(" · ");
  }
  if (o.type === "HOMESTAY") {
    const when = [o.checkIn, o.checkOut].filter(Boolean).join(" ~ ");
    const nights = o.nights != null ? `${o.nights}晚` : "";
    const parts = [o.roomName, when ? `${when} 入住` : "", nights].filter(Boolean);
    if (when || nights) return parts.join(" · ");
    return [o.roomName, o.subtitle].filter(Boolean).join(" · ");
  }
  const itemText = (o.items ?? []).map((i) => `${i.name} ×${i.quantity}`).join("，");
  return itemText || o.title || "";
});

const actionText = computed(() => {
  if (props.order.status === "WAIT_VERIFY") return props.order.type === "PICKING" ? tr("核销") : "";
  if (props.order.status === "WAIT_SHIP") return tr("发货");
  if (props.order.status === "REFUNDING") return tr("处理退款");
  return "";
});
</script>

<template>
  <view class="order card" @tap="emit('select')">
    <view class="order__head">
      <text class="order__no">{{ tr("订单号") }} {{ order.orderNo }}</text>
      <StatusTag :status="order.status" kind="order" />
    </view>

    <view class="order__body">
      <view class="order__line">
        <text class="order__type">{{ tr(typeText) }}</text>
        <text class="order__customer">{{ order.customerName }}</text>
      </view>
      <text class="order__summary">{{ summary }}</text>
    </view>

    <view class="order__foot">
      <view class="order__amount">
        <text class="order__amount-num">¥{{ formatMoney(order.amount) }}</text>
      </view>
      <view v-if="actionText" class="order__action" @tap.stop="emit('action')">{{ actionText }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.order {
  padding: 24rpx;
}

.order__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid $line-2;
}

.order__no {
  font-size: 24rpx;
  color: $text-sub;
}

.order__body {
  padding: 16rpx 0;
}

.order__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order__type {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
}

.order__customer {
  font-size: 26rpx;
  color: $text-main;
}

.order__summary {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.order__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.order__amount-num {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-main;
}

.order__action {
  height: 64rpx;
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  background: $green;
  color: #f7f3e6;
  font-size: 24rpx;
  font-weight: 600;
}
</style>
