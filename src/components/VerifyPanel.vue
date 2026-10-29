<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import type { Order } from "@/types/business";
import { queryVerifyOrder, verifyOrder } from "@/api/verify";
import { maskMobile } from "@/utils/format";
import { tr } from "@/utils/i18n";

const code = ref("");
const queried = ref<Order | null>(null);
const verifying = ref(false);
const inputFocus = ref(true);
const result = ref<{ success: boolean; message: string; order?: Order } | null>(null);

const codeDigits = computed(() => {
  const arr = ["", "", "", "", "", ""];
  for (let i = 0; i < code.value.length && i < 6; i++) {
    arr[i] = code.value[i];
  }
  return arr;
});

const emit = defineEmits<{ (e: "done", order: Order): void }>();

function onInput(e: any) {
  code.value = (e.detail?.value ?? "").replace(/\D/g, "").slice(0, 6);
}

function reset() {
  code.value = "";
  queried.value = null;
  result.value = null;
}

async function onQuery() {
  if (code.value.length !== 6) {
    uni.showToast({ title: tr("请输入 6 位核销码"), icon: "none" });
    return;
  }
  const res = await queryVerifyOrder(code.value);
  if (!res.data) {
    result.value = { success: false, message: tr("核销码无效") };
    queried.value = null;
    return;
  }
  queried.value = res.data;
  result.value = null;
}

async function onConfirm() {
  if (!queried.value) return;
  verifying.value = true;
  const res = await verifyOrder(code.value);
  verifying.value = false;
  if (res.data.success) {
    result.value = { success: true, message: tr("核销成功"), order: res.data.order };
    queried.value = null;
    emit("done", res.data.order as Order);
  } else {
    result.value = { success: false, message: res.data.reason ?? tr("核销失败") };
  }
}

function onScan() {
  // H5 无扫码能力；小程序端可调用 uni.scanCode
  // #ifdef MP-WEIXIN
  uni.scanCode({
    success: (r) => {
      code.value = (r.result ?? "").replace(/\D/g, "").slice(0, 6);
      onQuery();
    },
    fail: () => uni.showToast({ title: tr("扫码失败"), icon: "none" }),
  });
  // #endif
  // #ifdef H5
  // 走不通的能力不给假按钮：直接把用户引到手输码这条可用路径上
  code.value = "";
  result.value = null;
  queried.value = null;
  inputFocus.value = false;
  nextTick(() => (inputFocus.value = true));
  uni.showToast({ title: tr("网页版不支持扫码，请输入游客订单上的 6 位核销码"), icon: "none" });
  // #endif
}
</script>

<template>
  <view class="verify">
    <view class="verify__scan" @tap="onScan">
      <image class="verify__scan-icon" src="/static/icons/icon-scan-green.svg" mode="aspectFit" />
      <text class="verify__scan-text">{{ tr("扫码核销") }}</text>
    </view>

    <text class="verify__hint">{{ tr("请输入 6 位核销码") }}</text>
    <view class="verify__code">
      <view v-for="(d, i) in codeDigits" :key="i" class="verify__cell" :class="{ active: code.length === i }">
        <text>{{ d }}</text>
      </view>
      <input
        class="verify__input"
        type="tel"
        :value="code"
        :maxlength="6"
        :focus="inputFocus"
        @input="onInput"
      />
    </view>

    <!-- 查询结果 -->
    <view v-if="queried" class="verify__order card">
      <text class="verify__order-name">{{ queried.orchardName || queried.roomName || tr("订单") }}</text>
      <view class="verify__order-row">
        <text>{{ tr("用户") }}</text>
        <text>{{ queried.customerName }} {{ maskMobile(queried.customerMobile) }}</text>
      </view>
      <view class="verify__order-row">
        <text>{{ tr("场次 / 房型") }}</text>
        <text>{{ queried.sessionDate }} {{ queried.sessionTime || (queried.checkIn + " " + tr("入住")) }}</text>
      </view>
      <view class="verify__order-row">
        <text>{{ tr("人数") }}</text>
        <text>{{ tr("{n} 人").replace("{n}", String(queried.people)) }}</text>
      </view>
      <view class="verify__order-row">
        <text>{{ tr("金额") }}</text>
        <text class="verify__amount">¥{{ queried.amount }}</text>
      </view>
    </view>

    <!-- 结果 -->
    <view v-if="result" class="verify__result card" :class="{ 'verify__result--ok': result.success }">
      <image
        class="verify__result-icon"
        :src="result.success ? '/static/icons/icon-check-green.svg' : '/static/icons/icon-close-gray.svg'"
        mode="aspectFit"
      />
      <text class="verify__result-text">{{ result.message }}</text>
      <text v-if="result.success && result.order" class="verify__result-sub">
        {{ (result.order.orchardName || result.order.roomName) + " · " + tr("核销时间") + " " + result.order.verifiedAt }}
      </text>
    </view>

    <view v-if="!queried" class="verify__query btn-primary" @tap="onQuery">{{ tr("查询订单") }}</view>
    <view v-else class="verify__confirm btn-primary" @tap="onConfirm">
      {{ verifying ? tr("核销中...") : tr("确认核销") }}
    </view>
    <view v-if="result && !result.success" class="verify__retry btn-ghost" @tap="reset">{{ tr("重新输入") }}</view>
  </view>
</template>

<style lang="scss" scoped>
.verify {
  padding: 24rpx;
}

.verify__scan {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green-bg;
  color: $green;
  margin-bottom: 40rpx;
}

.verify__scan-icon {
  width: 40rpx;
  height: 40rpx;
}

.verify__scan-text {
  font-size: 28rpx;
  font-weight: 600;
}

.verify__hint {
  display: block;
  text-align: center;
  font-size: 26rpx;
  color: $text-sub;
  margin-bottom: 24rpx;
}

.verify__code {
  position: relative;
  display: flex;
  gap: 16rpx;
  justify-content: center;
}

.verify__cell {
  width: 88rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $surface;
  border: 2rpx solid $line;
  font-size: 44rpx;
  font-weight: 700;
  color: $text-main;

  &.active {
    border-color: $green;
  }
}

.verify__input {
  position: absolute;
  left: -9999rpx;
  opacity: 0;
  height: 1rpx;
  width: 1rpx;
}

.verify__order {
  margin-top: 32rpx;
  padding: 24rpx;
}

.verify__order-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
  margin-bottom: 16rpx;
}

.verify__order-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
  font-size: 26rpx;
  color: $text-sub;

  text:last-child {
    color: $text-main;
  }
}

.verify__amount {
  color: $green;
  font-weight: 700;
}

.verify__result {
  margin-top: 32rpx;
  padding: 48rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.verify__result-icon {
  width: 96rpx;
  height: 96rpx;
}

.verify__result-text {
  font-size: 32rpx;
  font-weight: 700;
  color: $text-main;
}

.verify__result-sub {
  font-size: 24rpx;
  color: $text-sub;
}

.verify__query,
.verify__confirm,
.verify__retry {
  margin-top: 40rpx;
}
</style>
