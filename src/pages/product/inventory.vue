<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getProducts, updateProductStock } from "@/api/product";
import type { Product, Sku } from "@/types/business";
import BottomPopup from "@/components/BottomPopup.vue";
import EmptyState from "@/components/EmptyState.vue";
import LoadingState from "@/components/LoadingState.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const products = ref<Product[]>([]);
const loading = ref(true);
const saving = ref(false);

const show = ref(false);
const editing = ref<{ product: Product; sku: Sku } | null>(null);
const newStock = ref(0);

async function load() {
  loading.value = true;
  try {
    const res = await getProducts();
    products.value = res.data ?? [];
  } catch (e) {
    console.error("[inventory] 加载商品失败", e);
    products.value = [];
  } finally {
    loading.value = false;
  }
}

onShow(load);

function onEdit(product: Product, sku: Sku) {
  editing.value = { product, sku };
  newStock.value = sku.stock;
  show.value = true;
}

async function onSave() {
  if (!editing.value || saving.value) return;
  const stock = Number(newStock.value);
  if (!Number.isFinite(stock) || stock < 0 || stock > 999999) {
    uni.showToast({ title: tr("请输入 0~999999 之间的库存数"), icon: "none" });
    return;
  }
  saving.value = true;
  try {
    await updateProductStock(editing.value.product.id, editing.value.sku.id, stock);
    show.value = false;
    uni.showToast({ title: tr("库存已更新"), icon: "none" });
    await load();
  } catch (e) {
    console.error("[inventory] 更新库存失败", e);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="inventory" :class="qmClass">
    <MerchantNavbar :title="tr('库存管理')" show-back show-home />
    <LoadingState v-if="loading" :rows="3" />
    <EmptyState
      v-else-if="!products.length"
      :title="tr('暂无商品')"
      :description="tr('当前商户还没有上架商品')"
    />

    <view v-else class="inventory__list">
      <view v-for="p in products" :key="p.id" class="inv card">
        <view class="inv__head">
          <text class="inv__name">{{ p.name }}</text>
          <view class="inv__total" :class="{ 'inv__total--warn': p.stock < 10 }">
            {{ p.stock < 10 ? tr("库存不足") : tr("库存 {n}").replace("{n}", String(p.stock)) }}
          </view>
        </view>
        <view v-for="sku in p.skus" :key="sku.id" class="inv__row">
          <text class="inv__sku">{{ sku.name }}</text>
          <text class="inv__stock" :class="{ 'inv__stock--warn': sku.stock < 10 }">{{ sku.stock }}</text>
          <view class="inv__btn" @tap="onEdit(p, sku)">{{ tr("改库存") }}</view>
        </view>
      </view>
    </view>

    <BottomPopup v-model:show="show" :title="editing ? `${editing.product.name} · ${editing.sku.name}` : ''">
      <view v-if="editing" class="edit">
        <text class="edit__label">{{ tr("修改库存") }}</text>
        <input v-model="newStock" type="number" class="edit__input" :placeholder="tr('件')" />
      </view>
      <template #footer>
        <view class="btn-primary" :class="{ 'btn-disabled': saving }" @tap="onSave">
          {{ tr(saving ? "保存中…" : "保存") }}
        </view>
      </template>
    </BottomPopup>
  </view>
</template>

<style lang="scss" scoped>
.inventory {
  min-height: 100vh;
  padding: 24rpx;
}

.inventory__list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.inv {
  padding: 24rpx;
}

.inv__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid $line-2;
}

.inv__name {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.inv__total {
  font-size: 24rpx;
  color: $green;

  &--warn {
    color: $danger;
  }
}

.inv__row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 20rpx 0;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }
}

.inv__sku {
  flex: 1;
  font-size: 26rpx;
  color: $text-main;
}

.inv__stock {
  font-size: 26rpx;
  color: $text-main;
  font-weight: 600;

  &--warn {
    color: $danger;
  }
}

.inv__btn {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: $green-bg;
  color: $green;
  font-size: 24rpx;
}

.edit {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.edit__label {
  font-size: 26rpx;
  color: $text-sub;
}

.edit__input {
  height: 80rpx;
  padding: 0 24rpx;
  border-radius: $radius-sm;
  background: $green-soft;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-disabled {
  opacity: 0.6;
  pointer-events: none;
}
</style>
