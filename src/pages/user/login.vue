<script setup lang="ts">
import { ref, computed, onUnmounted } from "vue";
import { onLoad } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { sendSmsCode } from "@/api/auth";
import { serverUrl } from "@/utils/server";
import { i18n, setLang, tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

const method = ref<"password" | "sms">("password");
const mobile = ref("");
const code = ref("");
const submitting = ref(false);
const redirect = ref("");
const heroImg = serverUrl("/static/images/orchard-plum-eco-w169.jpg");

const countdown = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

onLoad((query) => {
  redirect.value = query?.redirect ? decodeURIComponent(query.redirect) : "";
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const codePlaceholder = computed(() => (method.value === "password" ? tr("请输入密码") : tr("请输入验证码")));

function toApply() {
  uni.navigateTo({ url: "/pages/user/apply" });
}

function switchMethod(m: "password" | "sms") {
  method.value = m;
  code.value = "";
}

async function onSendCode() {
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请输入正确的手机号"), icon: "none" });
    return;
  }
  await sendSmsCode(mobile.value);
  uni.showToast({ title: tr("验证码已发送（Mock：123456）"), icon: "none" });
  countdown.value = 60;
  timer = setInterval(() => {
    countdown.value -= 1;
    if (countdown.value <= 0 && timer) clearInterval(timer);
  }, 1000);
}

async function onSubmit() {
  if (!/^1\d{10}$/.test(mobile.value)) {
    uni.showToast({ title: tr("请输入正确的手机号"), icon: "none" });
    return;
  }
  if (!code.value) {
    uni.showToast({ title: codePlaceholder.value, icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    await merchantStore.login(mobile.value, code.value, method.value);
    uni.showToast({ title: tr("登录成功"), icon: "success" });
    setTimeout(() => {
      if (redirect.value) {
        uni.reLaunch({ url: redirect.value });
      } else {
        uni.reLaunch({ url: "/pages/index/index" });
      }
    }, 400);
  } catch (e: any) {
    uni.showToast({ title: e.message || tr("登录失败"), icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="login" :class="qmClass">
    <image class="login__bg" :src="heroImg" mode="aspectFill" />
    <view class="login__scrim" />

    <view class="login__content" :style="{ paddingTop: 'calc(var(--status-bar-height) + 28rpx)' }">
      <view class="login__top">
        <view class="login__wordmark">
          <text class="login__brand">{{ tr("青梅里") }}</text>
          <text class="login__badge">{{ tr("商家端") }}</text>
        </view>
        <view class="login__lang">
          <text class="login__lang-item" :class="{ on: i18n.lang === 'zh' }" @tap="setLang('zh')">中文</text>
          <text class="login__lang-item" :class="{ on: i18n.lang === 'en' }" @tap="setLang('en')">EN</text>
        </view>
      </view>

      <view class="login__spacer" />

      <text class="login__headline">{{ tr("把山里的生意，") }}</text>
      <text class="login__headline">{{ tr("做得更轻。") }}</text>
      <view class="login__caps">
        <text class="login__cap">{{ tr("订单") }}</text>
        <text class="login__cap">{{ tr("核销") }}</text>
        <text class="login__cap">{{ tr("结算") }}</text>
        <text class="login__cap">{{ tr("经营数据") }}</text>
      </view>

      <view class="login__sheet">
        <view class="login__tabs">
          <view
            class="login__tab"
            :class="{ active: method === 'password' }"
            @tap="switchMethod('password')"
          >
            {{ tr("密码登录") }}
          </view>
          <view
            class="login__tab"
            :class="{ active: method === 'sms' }"
            @tap="switchMethod('sms')"
          >
            {{ tr("验证码登录") }}
          </view>
        </view>

        <view class="login__field">
          <text class="login__label">{{ tr("手机号") }}</text>
          <input
            class="login__input"
            type="tel"
            :maxlength="11"
            v-model="mobile"
            :placeholder="tr('请输入手机号')"
            placeholder-class="login__placeholder"
          />
        </view>

        <view class="login__field">
          <text class="login__label">{{ method === "password" ? tr("密码") : tr("验证码") }}</text>
          <input
            class="login__input"
            :type="method === 'password' ? 'password' : 'number'"
            :maxlength="method === 'password' ? 20 : 6"
            v-model="code"
            :placeholder="codePlaceholder"
            placeholder-class="login__placeholder"
          />
          <view v-if="method === 'sms'" class="login__send" @tap="countdown === 0 && onSendCode()">
            {{ countdown > 0 ? countdown + "s" : tr("获取验证码") }}
          </view>
        </view>

        <view class="login__submit" @tap="onSubmit">
          {{ submitting ? tr("登录中…") : tr("进入工作台") }}
        </view>

        <text class="login__tip">{{ tr("演示账号 13700000002 · 密码 123456") }}</text>
        <view class="login__apply" @tap="toApply">
          <text>{{ tr("还没有店铺？申请入驻") }}</text>
          <text class="login__apply-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.login {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background: var(--qm-bg, #fbfbf9);
}

.login__bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0.85;
}

.login__scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(130% 42% at 28% 34%, rgba(251, 251, 249, 0.62) 0%, rgba(251, 251, 249, 0.28) 45%, rgba(251, 251, 249, 0) 72%),
    linear-gradient(180deg, rgba(251, 251, 249, 0.35) 0%, rgba(251, 251, 249, 0.38) 55%, rgba(251, 251, 249, 0.6) 100%);
}

.login__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 40rpx calc(40rpx + env(safe-area-inset-bottom));
}

.login__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}

.login__wordmark {
  display: flex;
  align-items: center;
  gap: 14rpx;
}

.login__brand {
  font-size: 24rpx;
  font-weight: 600;
  letter-spacing: 0.2em;
  color: $text-main;
  text-shadow: 0 0 10rpx rgba(255, 255, 255, 0.98), 0 0 22rpx rgba(255, 255, 255, 0.9);
}

.login__badge {
  padding: 5rpx 14rpx;
  border-radius: 8rpx;
  background: rgba(var(--qm-primary-rgb), 0.12);
  border: 1rpx solid rgba(var(--qm-primary-rgb), 0.28);
  color: $green;
  font-size: 18rpx;
  letter-spacing: 0.1em;
}

.login__en {
  font-size: 14rpx;
  letter-spacing: 0.24em;
  color: $text-mute;
}

.login__spacer {
  flex: 1;
  min-height: 60rpx;
}

.login__headline {
  font-family: $font-serif;
  font-size: 58rpx;
  font-weight: 500;
  line-height: 1.42;
  letter-spacing: 0.05em;
  color: $text-main;
  text-shadow: 0 0 14rpx rgba(255, 255, 255, 0.98), 0 0 30rpx rgba(255, 255, 255, 0.92), 0 2rpx 6rpx rgba(255, 255, 255, 0.9);
}

.login__caps {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 22rpx;
}

.login__cap {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(27, 36, 29, 0.05);
  border: 1rpx solid $line;
  font-size: 19rpx;
  letter-spacing: 0.06em;
  color: $text-sub;
}

/* 浅色玻璃表单 */
.login__sheet {
  margin-top: 44rpx;
  padding: 30rpx 30rpx 26rpx;
  border-radius: 32rpx;
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 34rpx 80rpx -34rpx rgba(16, 36, 26, 0.28), inset 0 2rpx 0 rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
}

.login__tabs {
  display: flex;
  gap: 36rpx;
  margin-bottom: 6rpx;
}

.login__tab {
  font-size: 27rpx;
  color: $text-mute;
  padding: 8rpx 0 12rpx;
  border-bottom: 2rpx solid transparent;
}

.login__tab.active {
  color: $text-main;
  font-weight: 600;
  border-bottom-color: $green;
}

.login__field {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  padding: 26rpx 0 20rpx;
  border-bottom: 1rpx solid $line;
}

.login__label {
  font-size: 19rpx;
  letter-spacing: 0.06em;
  color: $text-mute;
}

.login__input {
  height: 58rpx;
  font-size: 32rpx;
  color: $text-main;
}

.login__placeholder {
  color: $text-mute;
}

.login__send {
  position: absolute;
  right: 0;
  bottom: 24rpx;
  font-size: 23rpx;
  color: $green;
}

.login__submit {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  margin-top: 44rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #fff;
  font-size: 29rpx;
  font-weight: 600;
  letter-spacing: 0.08em;
  box-shadow: 0 18rpx 40rpx -18rpx rgba(var(--qm-primary-rgb), 0.55);
  transition: transform 0.16s $ease, opacity 0.16s $ease;
}

.login__submit:active {
  transform: scale(0.99);
  opacity: 0.9;
}

.login__tip {
  display: block;
  margin-top: 22rpx;
  text-align: center;
  font-size: 19rpx;
  color: $text-mute;
}

.login__apply {
  margin-top: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: $text-sub;
}

.login__apply-arrow {
  font-size: 28rpx;
  line-height: 1;
}

.login__lang {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 4rpx;
  border-radius: 999rpx;
  background: rgba(27, 36, 29, 0.05);
}

.login__lang-item {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  color: $text-mute;
}

.login__lang-item.on {
  background: rgba(var(--qm-primary-rgb), 0.14);
  color: $green;
}
</style>
