<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { go } from "@/utils/navigation";
import { getStorage, setStorage } from "@/utils/storage";
import { CACHE_KEYS, STORAGE_KEYS } from "@/utils/constants";
import * as merchantApi from "@/api/merchant";
import { tr } from "@/utils/i18n";
import { useQmPalette } from "@/composables/useQmPalette";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();
const palette = useQmPalette();


/**
 * 消息偏好设置
 * 说明：后端暂无「商户消息偏好」表，因此这类纯偏好项落地在本地存储，
 * 保证开关状态真实持久化（刷新/重进不丢），而不是每次渲染都被重置。
 */
const PREF_KEY = STORAGE_KEYS.notifyPref;

interface Pref {
  key: string;
  label: string;
  desc: string;
  value: boolean;
}

const DEFAULTS: Pref[] = [
  { key: "order", label: tr("订单通知"), desc: tr("新订单、取消、退款申请"), value: true },
  { key: "stock", label: tr("库存提醒"), desc: tr("库存不足或房态售罄"), value: true },
  { key: "system", label: tr("系统通知"), desc: tr("平台公告与规则更新"), value: false },
  { key: "audit", label: tr("审核结果"), desc: tr("资质审核与提现进度"), value: true },
];

const merchantStore = useMerchantStore();
const settings = ref<Pref[]>(DEFAULTS.map((s) => ({ ...s })));

function loadPref() {
  const saved = getStorage<Record<string, boolean>>(PREF_KEY, {});
  settings.value = DEFAULTS.map((s) => ({
    ...s,
    value: typeof saved[s.key] === "boolean" ? saved[s.key] : s.value,
  }));
}

function persist() {
  const map: Record<string, boolean> = {};
  settings.value.forEach((s) => (map[s.key] = s.value));
  setStorage(PREF_KEY, map);
}

function onToggle(key: string, e: Event) {
  const value = (e as unknown as { detail: { value: boolean } }).detail.value;
  const item = settings.value.find((s) => s.key === key);
  if (!item) return;
  item.value = value;
  persist();
}

/** 修改手机号：跳转到资料页，手机号属于商家资料的受控字段 */
function onChangeMobile() {
  uni.showModal({
    title: tr("修改手机号"),
    content: tr("手机号是登录凭据，需在「商家资料」中提交修改，由平台审核后生效。"),
    confirmText: tr("去修改"),
    success: (r) => {
      if (r.confirm) go("pages/user/profile");
    },
  });
}

/**
 * 修改密码
 * 后端 POST /api/merchant/password：首次修改前商户无 password_hash，
 * 原密码按平台初始密码校验；改成功后写入 BCrypt 哈希，登录时优先按哈希校验。
 */
function askText(title: string, placeholder: string): Promise<string | null> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      editable: true,
      placeholderText: placeholder,
      success: (r) => resolve(r.confirm ? String(r.content ?? "").trim() : null),
      fail: () => resolve(null),
    });
  });
}

async function onChangePassword() {
  const oldPassword = await askText(tr("输入原密码"), tr("演示环境初始密码为 123456"));
  if (oldPassword === null) return;
  const newPassword = await askText(tr("设置新密码"), tr("至少 6 位"));
  if (newPassword === null) return;
  if (newPassword.length < 6) {
    uni.showToast({ title: tr("新密码长度不能少于6位"), icon: "none" });
    return;
  }
  uni.showLoading({ title: tr("提交中"), mask: true });
  try {
    const res = await merchantApi.changePassword(oldPassword, newPassword);
    uni.hideLoading();
    if (res.code === 0) {
      uni.showToast({ title: tr("密码已修改，请用新密码登录"), icon: "none" });
    } else {
      uni.showToast({ title: res.message || tr("修改失败"), icon: "none" });
    }
  } catch (e: any) {
    uni.hideLoading();
    uni.showToast({ title: e?.message || tr("修改失败"), icon: "none" });
  }
}

function onClearCache() {
  uni.showModal({
    title: tr("清除缓存"),
    content: tr("将清除本地缓存的消息已读标记与通知偏好（不会退出登录）。"),
    success: (r) => {
      if (!r.confirm) return;
      CACHE_KEYS.forEach((k) => uni.removeStorageSync(k));
      uni.showToast({ title: tr("缓存已清除"), icon: "success" });
    },
  });
}

function onAbout() {
  uni.showModal({
    title: tr("关于青梅里商家端"),
    content: tr("青梅里 · 乡村振兴农旅平台（商家端）\n版本 v4.0.0\n© 2026 青梅里"),
    showCancel: false,
  });
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  loadPref();
});
</script>

<template>
  <view class="settings" :class="qmClass">
    <MerchantNavbar :title="tr('设置')" show-back show-home />
    <view class="settings__section">
      <text class="settings__section-title">{{ tr("消息通知") }}</text>
      <view class="settings__card card">
        <view v-for="s in settings" :key="s.key" class="settings__row">
          <view class="settings__row-left">
            <text class="settings__label">{{ tr(s.label) }}</text>
            <text class="settings__desc">{{ tr(s.desc) }}</text>
          </view>
          <switch :checked="s.value" :color="palette.primary" @change="onToggle(s.key, $event)" />
        </view>
      </view>
    </view>

    <view class="settings__section">
      <text class="settings__section-title">{{ tr("账号安全") }}</text>
      <view class="settings__card card">
        <view class="settings__row settings__row--link" @tap="onChangePassword">
          <text class="settings__label">{{ tr("修改密码") }}</text>
          <text class="settings__arrow">›</text>
        </view>
        <view class="settings__row settings__row--link" @tap="onChangeMobile">
          <text class="settings__label">{{ tr("修改手机号") }}</text>
          <text class="settings__arrow">›</text>
        </view>
      </view>
    </view>

    <view class="settings__section">
      <text class="settings__section-title">{{ tr("通用") }}</text>
      <view class="settings__card card">
        <view class="settings__row settings__row--link" @tap="go('pages/user/display')">
          <text class="settings__label">{{ tr("外观与关怀模式") }}</text>
          <text class="settings__arrow">›</text>
        </view>
        <view class="settings__row settings__row--link" @tap="onClearCache">
          <text class="settings__label">{{ tr("清除缓存") }}</text>
          <text class="settings__arrow">›</text>
        </view>
        <view class="settings__row settings__row--link" @tap="onAbout">
          <text class="settings__label">{{ tr("关于我们") }}</text>
          <text class="settings__arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.settings {
  min-height: 100vh;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.settings__section {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.settings__section-title {
  font-size: 25rpx;
  color: $text-sub;
  padding-left: 8rpx;
}

.settings__card {
  padding: 0 24rpx;
}

.settings__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }

  &--link:active {
    opacity: 0.6;
  }
}

.settings__row-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.settings__label {
  font-size: 28rpx;
  color: $text-main;
}

.settings__desc {
  font-size: 22rpx;
  color: $text-sub;
}

.settings__arrow {
  font-size: 32rpx;
  color: #c0c6c1;
}
</style>
