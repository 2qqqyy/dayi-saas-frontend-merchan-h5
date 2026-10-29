<script setup lang="ts">
import { tr } from "@/utils/i18n";
import type { Product } from "@/types/business";
import StatusTag from "@/components/StatusTag.vue";
import { imgSrc } from "@/utils/image";

defineProps<{ product: Product }>();

const emit = defineEmits<{
  (e: "select"): void;
  (e: "edit"): void;
  (e: "onOff"): void;
  (e: "schedule"): void;
  (e: "stock"): void;
  (e: "delete"): void;
}>();
</script>

<template>
  <view class="product card" @tap="emit('select')">
    <image class="product__img" :src="imgSrc(product.image)" mode="aspectFill" />
    <view class="product__body">
      <view class="product__top">
        <text class="product__name">{{ product.name }}</text>
        <StatusTag :status="product.status" kind="product" />
      </view>
      <view class="product__price-row">
        <text class="product__price">¥{{ product.price }}</text>
        <text class="product__sales">销量 {{ product.sales }}</text>
      </view>
      <text class="product__stock" :class="{ 'product__stock--warn': product.stock < 10 }">
        库存：{{ product.stock }}
      </text>
      <view v-if="product.auditStatus === 0" class="product__audit product__audit--wait">
        <text>{{ tr("审核中") }}</text>
      </view>
      <view v-else-if="product.auditStatus === 2" class="product__audit product__audit--reject">
        <text>{{ tr("已驳回") }}{{ product.auditRemark ? "：" + product.auditRemark : "" }}</text>
      </view>
      <view class="product__actions" @tap.stop>
        <view class="product__btn" @tap="emit('onOff')">
          {{ product.status === "ON_SALE" ? "下架" : "上架" }}
        </view>
        <view class="product__btn" @tap="emit('stock')">库存</view>
        <view class="product__btn" @tap="emit('schedule')">定时</view>
        <view class="product__btn" @tap="emit('edit')">编辑</view>
        <view class="product__btn product__btn--danger" @tap="emit('delete')">删除</view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.product {
  display: flex;
  gap: 20rpx;
  padding: 20rpx;
}

.product__img {
  width: 160rpx;
  height: 160rpx;
  border-radius: $radius-sm;
  flex-shrink: 0;
  background: $green-soft;
}

.product__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.product__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product__name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product__price-row {
  display: flex;
  align-items: baseline;
  gap: 16rpx;
  margin-top: 8rpx;
}

.product__price {
  font-size: 32rpx;
  font-weight: 700;
  color: $green;
}

.product__sales {
  font-size: 22rpx;
  color: $text-sub;
}

.product__stock {
  font-size: 24rpx;
  color: $text-sub;
  margin-top: 4rpx;

  &--warn {
    color: $danger;
  }
}

.product__audit {
  margin-top: 10rpx;
  align-self: flex-start;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  font-size: 21rpx;
}

.product__audit--wait {
  background: $yellow-soft;
  color: $yellow-deep;
}

.product__audit--reject {
  background: rgba(168, 66, 47, 0.1);
  color: $danger;
}

.product__actions {
  display: flex;
  gap: 12rpx;
  margin-top: auto;
  padding-top: 12rpx;
}

.product__btn {
  flex: 1;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $green-soft;
  color: $text-main;
  font-size: 22rpx;

  &--danger {
    color: $danger;
    background: var(--qm-danger-bg, #f5e3dd);
  }
}
</style>
