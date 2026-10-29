<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { getProducts, updateProductStatus, deleteProduct, scheduleProduct } from "@/api/product";
import { PRODUCT_CATEGORIES, matchProductCategory } from "@/utils/constants";
import { go } from "@/utils/navigation";
import type { Product } from "@/types/business";
import SearchBar from "@/components/SearchBar.vue";
import ProductCard from "@/components/ProductCard.vue";
import LoadingState from "@/components/LoadingState.vue";
import EmptyState from "@/components/EmptyState.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const products = ref<Product[]>([]);
const loading = ref(true);
const keyword = ref("");
const category = ref("全部");

const categories = ["全部", ...PRODUCT_CATEGORIES];

const list = computed(() => {
  let arr = products.value;
  if (category.value !== "全部") arr = arr.filter((p) => matchProductCategory(p.category, category.value));
  if (keyword.value) arr = arr.filter((p) => p.name.includes(keyword.value));
  return arr;
});

async function load() {
  loading.value = true;
  try {
    const res = await getProducts();
    products.value = res.data;
  } catch {
    products.value = [];
  } finally {
    loading.value = false;
  }
}

onShow(load);

async function onToggle(p: Product) {
  const next = p.status === "ON_SALE" ? "OFF_SALE" : "ON_SALE";
  const res: any = await updateProductStatus(p.id, next);
  if (res?.code !== 0) {
    uni.showToast({ title: res?.message || tr("操作失败"), icon: "none" });
    return;
  }
  uni.showToast({ title: tr(next === "ON_SALE" ? "已上架" : "已下架"), icon: "none" });
  load();
}

/** 定时上架：输入“YYYY-MM-DD HH:mm”，到点自动上架 */
function onSchedule(p: Product) {
  uni.showModal({
    title: tr("定时上架"),
    editable: true,
    placeholderText: "2026-11-01 09:00",
    success: async (r) => {
      if (!r.confirm) return;
      const time = (r.content || "").trim();
      if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(time)) {
        uni.showToast({ title: tr("格式应为 YYYY-MM-DD HH:mm"), icon: "none" });
        return;
      }
      const res = await scheduleProduct(p.id, time);
      if (res.code !== 0) {
        uni.showToast({ title: res.message || tr("设置失败"), icon: "none" });
        return;
      }
      uni.showToast({ title: tr("已设置定时上架"), icon: "success" });
      load();
    },
  });
}

function onStock(p: Product) {
  go(`pages/product/inventory?productId=${p.id}`);
}

function onDelete(p: Product) {
  uni.showModal({
    title: tr("删除商品"),
    content: tr("确定删除「{name}」吗？").replace("{name}", p.name),
    success: async (r) => {
      if (r.confirm) {
        try {
          const res: any = await deleteProduct(p.id);
          if (res?.code !== 0) {
            uni.showToast({ title: res?.message || tr("操作失败"), icon: "none" });
            return;
          }
          uni.showToast({ title: tr("已删除"), icon: "none" });
          load();
        } catch {
          /* 请求层已提示 */
        }
      }
    },
  });
}
</script>

<template>
  <view class="product" :class="qmClass">
    <MerchantNavbar :title="tr('商品管理')" show-back show-home />
    <view class="product__top">
      <SearchBar v-model="keyword" :placeholder="tr('搜索商品')" />
    </view>

    <view class="product__cats">
      <view
        v-for="c in categories"
        :key="c"
        class="product__cat"
        :class="{ active: category === c }"
        @tap="category = c"
      >
        {{ tr(c) }}
      </view>
    </view>

    <view class="product__list">
      <LoadingState v-if="loading" :rows="3" />
      <EmptyState v-else-if="!list.length" :title="tr('暂无商品')" />
      <template v-else>
        <ProductCard
          v-for="p in list"
          :key="p.id"
          :product="p"
          @select="go(`pages/product/edit?id=${p.id}`)"
          @edit="go(`pages/product/edit?id=${p.id}`)"
          @on-off="onToggle(p)"
          @stock="onStock(p)"
          @schedule="onSchedule(p)"
          @delete="onDelete(p)"
        />
      </template>
    </view>

    <view class="product__add btn-primary" @tap="go('pages/product/create')">{{ tr("新增商品") }}</view>
  </view>
</template>

<style lang="scss" scoped>
.product {
  min-height: 100vh;
  padding-bottom: 160rpx;
}

.product__top {
  padding: 16rpx 24rpx;
  background: $surface;
  position: sticky;
  top: 0;
  z-index: 10;
}

.product__cats {
  display: flex;
  gap: 12rpx;
  padding: 16rpx 24rpx;
  white-space: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
}

.product__cat {
  flex-shrink: 0;
  padding: 10rpx 28rpx;
  border-radius: 32rpx;
  background: $surface;
  color: $text-main;
  font-size: 26rpx;

  &.active {
    background: $green;
    color: #f7f3e6;
  }
}

.product__list {
  padding: 8rpx 24rpx 48rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.product__add {
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
}
</style>
