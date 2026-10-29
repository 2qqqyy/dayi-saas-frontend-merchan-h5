<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { reactive, ref } from "vue";
import { createProduct } from "@/api/product";
import { PRODUCT_CATEGORIES } from "@/utils/constants";
import { chooseAndUploadImage, resolveFileUrl } from "@/utils/upload";
import { goBack } from "@/utils/navigation";
import type { Sku } from "@/types/business";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const form = reactive({
  name: "",
  category: "青梅",
  summary: "",
  weight: "",
  origin: "",
  freight: 0,
  image: "",
});

const uploading = ref(false);

/** 选择并上传商品主图（真实上传到后端 /api/common/upload） */
async function onPickImage() {
  if (uploading.value) return;
  uploading.value = true;
  try {
    const res = await chooseAndUploadImage("product");
    form.image = res.url;
    uni.showToast({ title: tr("图片已上传"), icon: "success" });
  } catch {
    /* 用户取消或已提示 */
  } finally {
    uploading.value = false;
  }
}

function onRemoveImage() {
  form.image = "";
}

const skus = ref<Sku[]>([{ id: "sku-" + Date.now(), name: "", price: 0, stock: 0, skuCode: "" }]);
/** 分类下拉展示文案（仅展示层翻译，选中后仍回填中文原值） */
const categoryOptions = PRODUCT_CATEGORIES.map((c) => tr(c));

function addSku() {
  skus.value.push({ id: "sku-" + Date.now() + "-" + Math.random(), name: "", price: 0, stock: 0, skuCode: "" });
}

function removeSku(i: number) {
  if (skus.value.length <= 1) {
    uni.showToast({ title: tr("至少保留一个规格"), icon: "none" });
    return;
  }
  skus.value.splice(i, 1);
}

function validate(): string {
  if (!form.name.trim()) return "请填写商品名称";
  if (!form.summary.trim()) return "请填写商品描述";
  for (const s of skus.value) {
    if (!s.name.trim()) return "请填写规格名称";
    if (s.price <= 0) return "规格价格需大于 0";
  }
  return "";
}

async function submit(onSale: boolean) {
  const err = validate();
  if (err) {
    uni.showToast({ title: tr(err), icon: "none" });
    return;
  }
  await createProduct({
    merchantId: "",
    name: form.name,
    image: form.image,
    category: form.category,
    summary: form.summary,
    price: skus.value[0].price,
    stock: skus.value.reduce((sum, s) => sum + Number(s.stock || 0), 0),
    weight: form.weight,
    origin: form.origin,
    freight: Number(form.freight || 0),
    status: onSale ? "ON_SALE" : "OFF_SALE",
    skus: skus.value.map((s) => ({ ...s, price: Number(s.price), stock: Number(s.stock) })),
  });
  uni.showToast({ title: tr(onSale ? "已上架" : "已保存草稿"), icon: "success" });
  setTimeout(() => goBack(), 400);
}
</script>

<template>
  <view class="form" :class="qmClass">
    <MerchantNavbar :title="tr('新增商品')" show-back show-home />
    <view class="form__card card">
      <!-- 商品主图（真实上传） -->
      <view class="form__row form__row--top">
        <text class="form__label">{{ tr("商品主图") }}</text>
        <view class="uploader">
          <view v-if="form.image" class="uploader__preview">
            <image class="uploader__img" :src="resolveFileUrl(form.image)" mode="aspectFill" />
            <view class="uploader__remove" @tap="onRemoveImage">×</view>
          </view>
          <view v-else class="uploader__add" @tap="onPickImage">
            <text class="uploader__plus">+</text>
            <text class="uploader__hint">{{ tr(uploading ? "上传中…" : "上传图片") }}</text>
          </view>
        </view>
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("商品名称") }}</text>
        <input v-model="form.name" class="form__input" :placeholder="tr('如：高山青梅果干')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("商品分类") }}</text>
        <picker :range="categoryOptions" @change="form.category = PRODUCT_CATEGORIES[Number(($event.detail as any).value)]">
          <view class="form__picker">{{ tr(form.category) }} ›</view>
        </picker>
      </view>
      <view class="form__row form__row--top">
        <text class="form__label">{{ tr("商品描述") }}</text>
        <textarea v-model="form.summary" class="form__textarea" :placeholder="tr('简要描述')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("重量") }}</text>
        <input v-model="form.weight" class="form__input" :placeholder="tr('如：500g')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("产地") }}</text>
        <input v-model="form.origin" class="form__input" :placeholder="tr('如：四川成都青梅乡村')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("运费") }}</text>
        <input v-model="form.freight" type="digit" class="form__input" placeholder="¥" />
      </view>
    </view>

    <!-- SKU -->
    <view class="form__card card">
      <view class="form__sku-head">
        <text class="form__label">{{ tr("商品规格 (SKU)") }}</text>
        <text class="form__add-sku" @tap="addSku">+ {{ tr("添加规格") }}</text>
      </view>
      <view v-for="(sku, i) in skus" :key="sku.id" class="sku">
        <view class="sku__head">
          <text class="sku__title">{{ tr("规格") }} {{ i + 1 }}</text>
          <text class="sku__del" @tap="removeSku(i)">{{ tr("删除") }}</text>
        </view>
        <view class="sku__row">
          <text class="sku__label">{{ tr("规格名") }}</text>
          <input v-model="sku.name" class="sku__input" :placeholder="tr('如：250g / 500g')" />
        </view>
        <view class="sku__row">
          <text class="sku__label">{{ tr("价格") }}</text>
          <input v-model="sku.price" type="digit" class="sku__input" placeholder="¥" />
        </view>
        <view class="sku__row">
          <text class="sku__label">{{ tr("库存") }}</text>
          <input v-model="sku.stock" type="number" class="sku__input" :placeholder="tr('件')" />
        </view>
        <view class="sku__row">
          <text class="sku__label">{{ tr("SKU编码") }}</text>
          <input v-model="sku.skuCode" class="sku__input" :placeholder="tr('选填')" />
        </view>
      </view>
    </view>

    <view class="form__actions">
      <view class="btn-ghost" @tap="submit(false)">{{ tr("保存草稿") }}</view>
      <view class="btn-primary" @tap="submit(true)">{{ tr("立即上架") }}</view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  padding-bottom: 64rpx;
}

.form__card {
  padding: 0 24rpx;
}

.form__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $line-2;
  gap: 24rpx;

  &--top {
    align-items: flex-start;
  }

  &:last-child {
    border-bottom: none;
  }
}

.form__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.form__input {
  flex: 1;
  height: 56rpx;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.form__picker {
  font-size: 28rpx;
  color: $text-main;
}

.form__textarea {
  flex: 1;
  height: 120rpx;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.form__sku-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
}

.form__add-sku {
  font-size: 26rpx;
  color: $green;
}

.sku {
  border-top: 1rpx solid $line-2;
  padding: 20rpx 0;
}

.sku__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.sku__title {
  font-size: 26rpx;
  font-weight: 600;
  color: $text-main;
}

.sku__del {
  font-size: 24rpx;
  color: $danger;
}

.sku__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  gap: 24rpx;
}

.sku__label {
  font-size: 24rpx;
  color: $text-sub;
}

.sku__input {
  flex: 1;
  height: 56rpx;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.form__actions {
  display: flex;
  gap: 20rpx;

  .btn-primary,
  .btn-ghost {
    flex: 1;
  }
}

/* ---- 图片上传 ---- */
.uploader {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}

.uploader__preview {
  position: relative;
  width: 180rpx;
  height: 180rpx;
}

.uploader__img {
  width: 100%;
  height: 100%;
  border-radius: $radius-sm;
  background: $bg;
}

.uploader__remove {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(8, 18, 12, 0.6);
  color: #fff;
  font-size: 28rpx;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.uploader__add {
  width: 180rpx;
  height: 180rpx;
  border-radius: $radius-sm;
  background: $bg;
  border: 2rpx dashed $line-strong;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.uploader__plus {
  font-size: 48rpx;
  color: #b3bab4;
  line-height: 1;
}

.uploader__hint {
  font-size: 22rpx;
  color: $text-sub;
}
</style>
