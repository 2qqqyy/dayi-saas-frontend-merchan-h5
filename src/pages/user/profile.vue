<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { tr } from "@/utils/i18n";
import { imgSrc } from "@/utils/image";
import { chooseAndUploadImage } from "@/utils/upload";
import { updateMerchantAvatar } from "@/api/merchant";
import type { MerchantInfo } from "@/types/business";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

const form = ref<MerchantInfo | null>(null);
const editing = ref(false);
const saving = ref(false);
const uploading = ref(false);

/** 换头像与游客端一致：选图 → 上传 → 落库 → 回显 */
async function onChooseAvatar() {
  if (uploading.value) return;
  uploading.value = true;
  uni.showLoading({ title: tr("上传中"), mask: true });
  try {
    const { url } = await chooseAndUploadImage("avatar");
    const res = await updateMerchantAvatar(url);
    uni.hideLoading();
    if (res.code !== 0 || !res.data) {
      uni.showToast({ title: res.message || tr("保存失败，请重试"), icon: "none" });
      return;
    }
    await merchantStore.fetchMerchantInfo();
    init();
    uni.showToast({ title: tr("头像已更新"), icon: "success" });
  } catch {
    uni.hideLoading();
  } finally {
    uploading.value = false;
  }
}

function init() {
  form.value = { ...(merchantStore.merchantInfo as MerchantInfo) };
}

function onField(key: string, value: string) {
  if (form.value) {
    (form.value as any)[key] = value;
  }
}

function validate(): string {
  if (!form.value) return "";
  if (!form.value.name?.trim()) return tr("请填写商家名称");
  if (!form.value.contact?.trim()) return tr("请填写联系人");
  if (!/^1[3-9]\d{9}$/.test(form.value.mobile ?? "")) return tr("请填写 11 位有效手机号");
  return "";
}

async function onSave() {
  if (!form.value) return;
  const err = validate();
  if (err) {
    uni.showToast({ title: err, icon: "none" });
    return;
  }
  saving.value = true;
  let ok = false;
  try {
    ok = await merchantStore.updateMerchant(form.value);
  } finally {
    saving.value = false;
  }
  if (!ok) {
    uni.showToast({ title: tr("保存失败，请重试"), icon: "none" });
    return;
  }
  editing.value = false;
  uni.showToast({ title: tr("已保存"), icon: "success" });
}

onShow(async () => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  init();
  // 先出缓存再拉服务端，避免资料页进来是空白
  try {
    await merchantStore.fetchMerchantInfo();
  } catch {
    /* 网络异常时保留缓存值 */
  }
  if (!editing.value) init();
});
</script>

<template>
  <view class="profile" :class="qmClass">
    <MerchantNavbar :title="tr('商家资料')" show-back show-home />
    <view class="profile__card card" v-if="form">
      <view class="profile__avatar-row">
        <image class="profile__avatar" :src="imgSrc(form.avatar)" mode="aspectFill" />
        <view class="profile__avatar-meta">
          <text class="profile__avatar-name">{{ form.name }}</text>
          <view class="profile__avatar-btn" @tap="onChooseAvatar">
            <text>{{ tr("更换头像") }}</text>
          </view>
        </view>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("商家名称") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          :value="form.name"
          @input="onField('name', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.name }}</text>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("联系人") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          :value="form.contact"
          @input="onField('contact', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.contact }}</text>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("联系电话") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          type="tel"
          :maxlength="11"
          :value="form.mobile"
          @input="onField('mobile', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.mobile }}</text>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("经营地址") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          :value="form.address"
          @input="onField('address', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.address }}</text>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("经营范围") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          :value="form.businessScope"
          :placeholder="tr('如：采摘体验 / 农产品销售')"
          @input="onField('businessScope', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.businessScope || tr("未填写") }}</text>
      </view>
      <view class="profile__row">
        <text class="profile__label">{{ tr("营业时间") }}</text>
        <input
          v-if="editing"
          class="profile__input"
          :value="form.openTime"
          :placeholder="tr('如：08:00-20:00')"
          @input="onField('openTime', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.openTime || tr("未填写") }}</text>
      </view>
      <view class="profile__row profile__row--top">
        <text class="profile__label">{{ tr("店铺公告") }}</text>
        <textarea
          v-if="editing"
          class="profile__textarea"
          :value="form.shopNotice"
          :placeholder="tr('如：本周六闭园维护，暂停采摘')"
          @input="onField('shopNotice', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.shopNotice || tr("未填写") }}</text>
      </view>
      <view class="profile__row profile__row--top">
        <text class="profile__label">{{ tr("商家简介") }}</text>
        <textarea
          v-if="editing"
          class="profile__textarea"
          :value="form.intro"
          @input="onField('intro', ($event.detail as any).value)"
        />
        <text v-else class="profile__value">{{ form.intro }}</text>
      </view>
    </view>

    <view class="profile__actions">
      <view v-if="!editing" class="btn-primary" @tap="editing = true">{{ tr("编辑资料") }}</view>
      <template v-else>
        <view class="btn-ghost" @tap="init(); editing = false">{{ tr("取消") }}</view>
        <view class="btn-primary" @tap="onSave">{{ saving ? tr("保存中...") : tr("保存") }}</view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.profile {
  min-height: 100vh;
  padding: 24rpx;
}

.profile__card {
  padding: 0 24rpx;
}

.profile__avatar-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $line-2;
}

.profile__avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: $img-bg;
  flex-shrink: 0;
}

.profile__avatar-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  gap: 16rpx;
}

.profile__avatar-name {
  font-size: 30rpx;
  font-weight: 700;
  color: $text-main;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.profile__avatar-btn {
  flex-shrink: 0;
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  border: 1rpx solid $line-strong;
  font-size: 24rpx;
  color: $text-sub;
}

.profile__row {
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

.profile__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.profile__value {
  font-size: 28rpx;
  color: $text-main;
  text-align: right;
  flex: 1;

  &--muted {
    color: $text-sub;
  }
}

.profile__input {
  flex: 1;
  height: 56rpx;
  text-align: right;
  font-size: 28rpx;
  color: $text-main;
}

.profile__textarea {
  flex: 1;
  height: 120rpx;
  font-size: 28rpx;
  color: $text-main;
  text-align: right;
}

.profile__actions {
  display: flex;
  gap: 20rpx;
  margin-top: 40rpx;

  .btn-primary,
  .btn-ghost {
    flex: 1;
  }
}
</style>
