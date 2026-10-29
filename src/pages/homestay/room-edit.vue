<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { reactive, ref } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { getRoom, createRoom, updateRoom } from "@/api/homestay";
import { chooseAndUploadImage, resolveFileUrl } from "@/utils/upload";
import { goBack } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const form = reactive({
  id: "",
  name: "",
  price: 0,
  capacity: 2,
  bedType: "1张大床",
  breakfast: "含双早",
  facilities: "空调、独立卫浴、免费WiFi",
  description: "",
  stock: 1,
  image: "",
});

const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);

/** 选择并上传房型主图（真实上传到后端 /api/common/upload） */
async function onPickImage() {
  if (uploading.value) return;
  uploading.value = true;
  try {
    const res = await chooseAndUploadImage("room");
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

onLoad(async (query) => {
  const id = query?.id as string;
  loading.value = true;
  try {
    if (id) {
      const res = await getRoom(id);
      if (res.data) {
        const r = res.data;
        form.id = r.id;
        form.name = r.name;
        form.price = r.price;
        form.capacity = r.capacity;
        form.bedType = r.bedType;
        form.breakfast = r.breakfast;
        form.facilities = r.facilities.join("、");
        form.description = r.description;
        form.stock = r.stock;
        form.image = r.image;
      } else {
        uni.showToast({ title: tr("房型不存在"), icon: "none" });
      }
    }
    // 新增时不预置占位图，由用户上传真实图片
  } catch {
    uni.showToast({ title: tr("加载失败"), icon: "none" });
  } finally {
    loading.value = false;
  }
});

function validate(): string {
  if (!form.name.trim()) return "请填写房型名称";
  if (!(Number(form.price) > 0)) return "请填写房间价格";
  if (!(Number(form.capacity) > 0)) return "请填写可入住人数";
  if (Number(form.stock) < 0) return "库存不能为负数";
  return "";
}

async function onSave() {
  if (saving.value) return;
  const err = validate();
  if (err) {
    uni.showToast({ title: tr(err), icon: "none" });
    return;
  }
  saving.value = true;
  try {
    const payload = {
      merchantId: "",
      name: form.name.trim(),
      price: Number(form.price),
      capacity: Number(form.capacity),
      bedType: form.bedType,
      breakfast: form.breakfast,
      facilities: form.facilities.split(/[、,，]/).map((s) => s.trim()).filter(Boolean),
      description: form.description,
      stock: Number(form.stock),
      status: "OPEN" as const,
      image: form.image,
    };
    if (form.id) {
      await updateRoom(form.id, payload);
    } else {
      await createRoom(payload);
    }
    uni.showToast({ title: tr("已保存"), icon: "success" });
    setTimeout(() => goBack(), 400);
  } catch {
    /* 拦截器已统一提示 */
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <view class="form" :class="qmClass">
    <MerchantNavbar :title="tr('编辑房间')" show-back show-home />
    <view v-if="!loading" class="form__card card">
      <!-- 房型主图（真实上传） -->
      <view class="form__row form__row--top">
        <text class="form__label">{{ tr("房型主图") }}</text>
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
        <text class="form__label">{{ tr("房型名称") }}</text>
        <input v-model="form.name" class="form__input" :placeholder="tr('如：青梅大床房')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("房间价格") }}</text>
        <input v-model="form.price" type="digit" class="form__input" :placeholder="'¥ / ' + tr('晚')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("可入住人数") }}</text>
        <input v-model="form.capacity" type="number" class="form__input" :placeholder="tr('人')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("床型") }}</text>
        <input v-model="form.bedType" class="form__input" :placeholder="tr('如：1张大床')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("早餐") }}</text>
        <input v-model="form.breakfast" class="form__input" :placeholder="tr('如：含双早')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("库存") }}</text>
        <input v-model="form.stock" type="number" class="form__input" :placeholder="tr('间')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("房间设施") }}</text>
        <input v-model="form.facilities" class="form__input" :placeholder="tr('顿号分隔')" />
      </view>
      <view class="form__row form__row--top">
        <text class="form__label">{{ tr("房间描述") }}</text>
        <textarea v-model="form.description" class="form__textarea" :placeholder="tr('选填')" />
      </view>
    </view>

    <view v-if="!loading" class="form__save" :class="saving ? 'btn-disabled' : 'btn-primary'" @tap="onSave">
      {{ tr(saving ? "保存中…" : "保存") }}
    </view>
  </view>
</template>

<style lang="scss" scoped>
.form {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 32rpx;
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

.form__textarea {
  flex: 1;
  height: 120rpx;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.form__save {
  margin-top: 8rpx;
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
