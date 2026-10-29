<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref, computed } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getOrderDetail, shipOrder, refundApprove, refundReject, rejectReservation } from "@/api/order";
import { formatMoney, maskMobile } from "@/utils/format";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import type { Order } from "@/types/business";
import StatusTag from "@/components/StatusTag.vue";
import BottomPopup from "@/components/BottomPopup.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const order = ref<Order | null>(null);
const loading = ref(true);
const error = ref("");
const acting = ref(false);

const shipShow = ref(false);
const company = ref("");
const trackingNo = ref("");
const shipping = ref(false);

const rejectShow = ref(false);
const rejectReason = ref("");
const rejecting = ref(false);

async function load(id: string) {
  loading.value = true;
  error.value = "";
  try {
    const res = await getOrderDetail(id);
    if (!res.data) {
      error.value = tr("订单不存在或无权查看");
      order.value = null;
    } else {
      order.value = res.data;
    }
  } catch (e: any) {
    error.value = e?.message || tr("订单加载失败");
    order.value = null;
  } finally {
    loading.value = false;
  }
}

onLoad((query) => {
  const id = query?.id as string;
  if (!id) {
    error.value = tr("缺少订单参数");
    loading.value = false;
    return;
  }
  load(id);
});

const typeText = computed(() => {
  if (!order.value) return "";
  if (order.value.type === "PICKING") return tr("采摘订单");
  if (order.value.type === "HOMESTAY") return tr("民宿订单");
  return tr("商城订单");
});

/** 主操作按钮文案（退款中状态由底部双按钮承载，不设主按钮） */
const actionText = computed(() => {
  if (!order.value) return "";
  // 民宿/商品没有核销环节，只有采摘单在待使用时可去核销
  if (order.value.status === "WAIT_VERIFY" && order.value.type === "PICKING") return tr("去核销");
  if (order.value.status === "WAIT_SHIP") return tr("发货");
  return "";
});

/** 是否为待处理退款（展示「同意 / 拒绝」双按钮） */
const isRefunding = computed(() => order.value?.status === "REFUNDING");

/** 待核销的采摘预约可拒绝接待 */
const isRejectable = computed(
  () => order.value?.type === "PICKING" && order.value?.status === "WAIT_VERIFY",
);

/** 拒绝预约：说明原因后全额退款并释放名额，游客会收到站内通知 */
function onRejectReservation() {
  if (!order.value) return;
  uni.showModal({
    title: tr("拒绝预约"),
    editable: true,
    placeholderText: tr("如：临时闭园，无法接待"),
    success: async (r) => {
      if (!r.confirm) return;
      const reason = (r.content || "").trim() || tr("商家临时无法接待");
      const res = await rejectReservation(order.value!.id, reason);
      if (res.code !== 0) {
        uni.showToast({ title: res.message || tr("操作失败"), icon: "none" });
        return;
      }
      uni.showToast({ title: tr("已取消并退款"), icon: "success" });
      reload();
    },
  });
}

function onPrimary() {
  if (!order.value) return;
  const s = order.value.status;
  if (s === "WAIT_VERIFY" && order.value.type === "PICKING") {
    go("pages/order/verify");
  } else if (s === "WAIT_SHIP") {
    shipShow.value = true;
  }
}

async function reload() {
  if (!order.value) return;
  await load(order.value.id);
}

async function onApproveRefund() {
  if (!order.value || acting.value) return;
  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: tr("同意退款"),
      content: tr("确认同意退款 ¥{amount}？款项将退回买家。").replace(
        "{amount}",
        formatMoney(order.value!.amount),
      ),
      confirmText: tr("同意退款"),
      success: (r) => resolve(Boolean(r.confirm)),
      fail: () => resolve(false),
    });
  });
  if (!confirmed) return;
  acting.value = true;
  try {
    const res = await refundApprove(order.value.id);
    if (res.code !== 0) {
      uni.showToast({ title: res.message || tr("操作失败"), icon: "none" });
      return;
    }
    uni.showToast({ title: tr("已同意退款"), icon: "success" });
    await reload();
  } catch {
    /* 拦截器已提示 */
  } finally {
    acting.value = false;
  }
}

function onOpenReject() {
  rejectReason.value = "";
  rejectShow.value = true;
}

async function onConfirmReject() {
  if (!order.value || rejecting.value) return;
  const reason = rejectReason.value.trim();
  if (!reason) {
    uni.showToast({ title: tr("请填写拒绝理由"), icon: "none" });
    return;
  }
  rejecting.value = true;
  try {
    const res = await refundReject(order.value.id, reason);
    if (res.code !== 0) {
      uni.showToast({ title: res.message || tr("操作失败"), icon: "none" });
      return;
    }
    rejectShow.value = false;
    uni.showToast({ title: tr("已拒绝退款"), icon: "success" });
    await reload();
  } catch {
    /* 拦截器已提示 */
  } finally {
    rejecting.value = false;
  }
}

async function onShip() {
  if (!order.value) return;
  if (!company.value.trim() || !trackingNo.value.trim()) {
    uni.showToast({ title: tr("请填写物流公司与单号"), icon: "none" });
    return;
  }
  if (shipping.value) return;
  shipping.value = true;
  try {
    const res = await shipOrder(order.value.id, company.value.trim(), trackingNo.value.trim());
    if (res.code !== 0) {
      uni.showToast({ title: res.message || tr("操作失败"), icon: "none" });
      return;
    }
    shipShow.value = false;
    uni.showToast({ title: tr("已发货"), icon: "success" });
    await reload();
  } catch {
    /* 拦截器已提示 */
  } finally {
    shipping.value = false;
  }
}

function onContact() {
  if (!order.value?.customerMobile) {
    uni.showToast({ title: tr("暂无联系方式"), icon: "none" });
    return;
  }
  uni.makePhoneCall({ phoneNumber: order.value.customerMobile });
}
</script>

<template>
  <view class="detail" :class="qmClass">
    <MerchantNavbar :title="tr('订单详情')" show-back show-home />
    <LoadingState v-if="loading" :rows="3" />

    <EmptyState
      v-else-if="error || !order"
      :title="tr('订单加载失败')"
      :description="error || tr('订单不存在')"
      :action-text="tr('返回订单列表')"
      @action="go('pages/order/index')"
    />

    <template v-else>
      <view class="detail__body">
        <view class="detail__card card">
          <view class="detail__head">
            <text class="detail__no">{{ tr("订单号") }} {{ order.orderNo }}</text>
            <StatusTag :status="order.status" kind="order" />
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ tr("订单类型") }}</text>
            <text class="detail__value">{{ typeText }}</text>
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ tr("下单时间") }}</text>
            <text class="detail__value">{{ order.createdAt }}</text>
          </view>
        </view>

        <!-- 采摘 / 民宿信息 -->
        <view v-if="order.type !== 'PRODUCT'" class="detail__card card">
          <text class="detail__title">{{ order.type === "PICKING" ? tr("预约信息") : tr("入住信息") }}</text>
          <view class="detail__row">
            <text class="detail__label">{{ order.type === "PICKING" ? tr("采摘园") : tr("房型") }}</text>
            <text class="detail__value">{{ order.orchardName || order.roomName }}</text>
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ order.type === "PICKING" ? tr("日期") : tr("入住") }}</text>
            <text class="detail__value">{{ order.sessionDate || order.checkIn }}</text>
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ order.type === "PICKING" ? tr("场次") : tr("离店") }}</text>
            <text class="detail__value">{{ order.sessionTime || order.checkOut }}</text>
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ order.type === "PICKING" ? tr("人数") : tr("晚数") }}</text>
            <text class="detail__value">{{ order.people }} {{ order.type === "PICKING" ? tr("人") : tr("晚") }}</text>
          </view>
          <view v-if="order.verifyCode" class="detail__row">
            <text class="detail__label">{{ tr("核销码") }}</text>
            <text class="detail__value detail__value--code">{{ order.verifyCode }}</text>
          </view>
          <view v-if="order.verifiedAt" class="detail__row">
            <text class="detail__label">{{ tr("核销时间") }}</text>
            <text class="detail__value">{{ order.verifiedAt }}</text>
          </view>
        </view>

        <!-- 商品信息 -->
        <view v-if="order.type === 'PRODUCT'" class="detail__card card">
          <text class="detail__title">{{ tr("商品信息") }}</text>
          <template v-if="order.items && order.items.length">
            <view v-for="(item, i) in order.items" :key="i" class="detail__row">
              <text class="detail__label">{{ item.name }}（{{ item.skuName }}）×{{ item.quantity }}</text>
              <text class="detail__value">¥{{ formatMoney(item.price * item.quantity) }}</text>
            </view>
          </template>
          <view v-else class="detail__row">
            <text class="detail__label">{{ tr("商品明细") }}</text>
            <text class="detail__value">{{ order.orchardName || "-" }}</text>
          </view>
        </view>

        <!-- 收货信息 -->
        <view v-if="order.type === 'PRODUCT'" class="detail__card card">
          <text class="detail__title">{{ tr("收货信息") }}</text>
          <view class="detail__row">
            <text class="detail__label">{{ tr("收货人") }}</text>
            <text class="detail__value">{{ order.receiver || order.customerName || "-" }}</text>
          </view>
          <view class="detail__row detail__row--top">
            <text class="detail__label">{{ tr("收货地址") }}</text>
            <text class="detail__value">{{ order.address || "-" }}</text>
          </view>
          <view v-if="order.shipping" class="detail__row">
            <text class="detail__label">{{ tr("物流") }}</text>
            <text class="detail__value">{{ order.shipping.company }} {{ order.shipping.trackingNo }}</text>
          </view>
        </view>

        <!-- 用户信息 -->
        <view class="detail__card card">
          <text class="detail__title">{{ tr("用户信息") }}</text>
          <view class="detail__row">
            <text class="detail__label">{{ tr("联系人") }}</text>
            <text class="detail__value">
              {{ order.customerName || "-" }}
              {{ order.customerMobile ? maskMobile(order.customerMobile) : "" }}
            </text>
          </view>
          <view class="detail__row">
            <text class="detail__label">{{ tr("订单金额") }}</text>
            <text class="detail__value detail__value--amount">¥{{ formatMoney(order.amount) }}</text>
          </view>
          <view class="detail__contact" @tap="onContact">{{ tr("联系用户") }}</view>
        </view>
      </view>

      <!-- 底部操作条：主操作与拒绝类操作合并为一条，避免两个 fixed 按钮重叠 -->
      <view v-if="actionText || isRefunding || isRejectable" class="detail__action detail__action--dual">
        <view v-if="isRejectable" class="detail__reject" @tap="onRejectReservation">{{ tr("拒绝预约") }}</view>
        <view v-if="isRefunding" class="detail__reject" @tap="onOpenReject">{{ tr("拒绝退款") }}</view>
        <view v-if="isRefunding" class="btn-primary detail__approve" @tap="onApproveRefund">
          {{ acting ? tr("处理中…") : tr("同意退款") }}
        </view>
        <view v-else-if="actionText" class="btn-primary detail__approve" @tap="onPrimary">{{ actionText }}</view>
      </view>
    </template>

    <!-- 发货弹层 -->
    <BottomPopup v-model:show="shipShow" :title="tr('填写物流信息')">
      <view class="ship">
        <view class="ship__field">
          <text class="ship__label">{{ tr("物流公司") }}</text>
          <input v-model="company" class="ship__input" :placeholder="tr('如：顺丰速运')" placeholder-class="ship__ph" />
        </view>
        <view class="ship__field">
          <text class="ship__label">{{ tr("物流单号") }}</text>
          <input v-model="trackingNo" class="ship__input" :placeholder="tr('请输入物流单号')" placeholder-class="ship__ph" />
        </view>
      </view>
      <template #footer>
        <view class="btn-primary" @tap="onShip">{{ shipping ? tr("发货中...") : tr("确认发货") }}</view>
      </template>
    </BottomPopup>

    <!-- 拒绝退款弹层 -->
    <BottomPopup v-model:show="rejectShow" :title="tr('拒绝退款')">
      <view class="ship">
        <view class="ship__field">
          <text class="ship__label">{{ tr("拒绝理由（买家可见）") }}</text>
          <textarea
            v-model="rejectReason"
            class="ship__textarea"
            :placeholder="tr('如：商品已按约发出，不支持无理由退款')"
            placeholder-class="ship__ph"
            :maxlength="200"
          />
          <text class="ship__counter">{{ rejectReason.length }}/200</text>
        </view>
      </view>
      <template #footer>
        <view class="btn-primary" @tap="onConfirmReject">{{ rejecting ? tr("提交中...") : tr("确认拒绝") }}</view>
      </template>
    </BottomPopup>
  </view>
</template>

<style lang="scss" scoped>
.detail {
  min-height: 100vh;
  padding: 24rpx;
  padding-bottom: 180rpx;
}

.detail__body {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.detail__card {
  padding: 24rpx;
}

.detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid $line-2;
  margin-bottom: 8rpx;
}

.detail__no {
  font-size: 26rpx;
  color: $text-main;
}

.detail__title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  display: block;
  margin-bottom: 8rpx;
}

.detail__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  gap: 24rpx;

  &--top {
    align-items: flex-start;
  }
}

.detail__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.detail__value {
  font-size: 26rpx;
  color: $text-main;
  text-align: right;
  flex: 1;

  &--amount {
    color: $green;
    font-weight: 700;
    font-size: 32rpx;
  }

  &--code {
    color: $warning;
    font-weight: 700;
    letter-spacing: 4rpx;
  }
}

.detail__action {
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

  &--dual {
    display: flex;
    gap: 16rpx;
    align-items: center;
    padding: 12rpx 24rpx calc(12rpx + env(safe-area-inset-bottom));
    height: auto;
    background: $surface;
    box-shadow: 0 -4rpx 20rpx rgba(38, 53, 42, 0.06);
  }
}

.detail__reject {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  border: 2rpx solid rgba(245, 108, 108, 0.5);
  color: $danger;
  font-size: 30rpx;
  font-weight: 600;
}

.detail__approve {
  flex: 1.4;
}

.detail__contact {
  margin-top: 16rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-lg;
  background: $green-bg;
  color: $green;
  font-size: 28rpx;
  font-weight: 600;
}

.ship {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.ship__field {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.ship__label {
  font-size: 24rpx;
  color: $text-sub;
}

.ship__input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 28rpx;
}

.ship__textarea {
  width: 100%;
  height: 180rpx;
  padding: 20rpx 24rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 28rpx;
  line-height: 1.6;
}

.ship__counter {
  font-size: 22rpx;
  color: $text-sub;
  text-align: right;
}

.ship__ph {
  color: #c0c6c1;
}
</style>
