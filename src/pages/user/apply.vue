<script setup lang="ts">
import { computed, ref } from "vue";
import { applyMerchant, MERCHANT_TYPE_OPTIONS } from "@/api/merchant";
import { go } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";
import MerchantNavbar from "@/components/MerchantNavbar.vue";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

const form = ref({
  name: "",
  type: 1,
  contact: "",
  mobile: "",
  address: "",
  businessScope: "",
  intro: "",
});
const submitting = ref(false);
const done = ref(false);

const typeOptions = computed(() => MERCHANT_TYPE_OPTIONS.map((t) => ({ ...t, label: tr(t.label) })));

function pickType(v: number) {
  form.value.type = v;
}

async function submit() {
  if (submitting.value) return;
  if (!form.value.name.trim()) {
    uni.showToast({ title: tr("请填写商户名称"), icon: "none" });
    return;
  }
  if (!form.value.contact.trim()) {
    uni.showToast({ title: tr("请填写联系人"), icon: "none" });
    return;
  }
  if (!/^1[3-9]\d{9}$/.test(form.value.mobile)) {
    uni.showToast({ title: tr("请填写 11 位有效手机号"), icon: "none" });
    return;
  }
  submitting.value = true;
  try {
    await applyMerchant({
      name: form.value.name.trim(),
      type: form.value.type,
      contact: form.value.contact.trim(),
      mobile: form.value.mobile,
      address: form.value.address.trim(),
      businessScope: form.value.businessScope.trim(),
      intro: form.value.intro.trim(),
    });
    done.value = true;
  } catch (e: any) {
    // 后端对重复手机号、字段校验失败都返回了具体原因，直接透出
    uni.showToast({ title: e?.message || tr("提交失败，请重试"), icon: "none" });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <view class="apply" :class="qmClass">
    <MerchantNavbar :title="tr('申请入驻')" show-back show-home />

    <view class="apply__body">
      <!-- 提交成功：给出后续流程，不留一个没有下文的提示 -->
      <view v-if="done" class="apply__done card">
        <text class="apply__done-title">{{ tr("申请已提交") }}</text>
        <text class="apply__done-desc">{{ tr("平台将在 1-3 个工作日内审核；审核通过后，该手机号即可在商家端登录并上传资质材料。") }}</text>
        <view class="apply__done-btn btn-primary" @tap="go('pages/user/login')">{{ tr("返回登录") }}</view>
      </view>

      <template v-else>
        <view class="apply__intro">
          <text class="apply__intro-title">{{ tr("成为青梅里的商家") }}</text>
          <text class="apply__intro-desc">{{ tr("填写基础信息即可提交，资质材料在审核通过后于商家端补充") }}</text>
        </view>

        <view class="apply__card card">
          <view class="apply__row">
            <text class="apply__label">{{ tr("商户名称") }}</text>
            <input v-model="form.name" class="apply__input" maxlength="40" :placeholder="tr('如：梅岭果园')" />
          </view>
          <view class="apply__row apply__row--column">
            <text class="apply__label">{{ tr("商户类型") }}</text>
            <view class="apply__types">
              <view
                v-for="t in typeOptions"
                :key="t.value"
                class="apply__type"
                :class="{ 'apply__type--on': form.type === t.value }"
                @tap="pickType(t.value)"
              >
                <text>{{ t.label }}</text>
              </view>
            </view>
          </view>
          <view class="apply__row">
            <text class="apply__label">{{ tr("联系人") }}</text>
            <input v-model="form.contact" class="apply__input" maxlength="20" :placeholder="tr('请输入姓名')" />
          </view>
          <view class="apply__row">
            <text class="apply__label">{{ tr("联系电话") }}</text>
            <input v-model="form.mobile" class="apply__input" type="tel" maxlength="11" :placeholder="tr('用于登录商家端')" />
          </view>
        </view>

        <view class="apply__card card">
          <view class="apply__row apply__row--column">
            <text class="apply__label">{{ tr("经营地址") }}</text>
            <input v-model="form.address" class="apply__input apply__input--full" maxlength="80" :placeholder="tr('如：四川省成都市大邑县青梅乡村')" />
          </view>
          <view class="apply__row apply__row--column">
            <text class="apply__label">{{ tr("经营范围") }}</text>
            <input v-model="form.businessScope" class="apply__input apply__input--full" maxlength="60" :placeholder="tr('如：采摘体验 / 农产品销售')" />
          </view>
          <view class="apply__row apply__row--column">
            <text class="apply__label">{{ tr("商家简介") }}</text>
            <textarea v-model="form.intro" class="apply__textarea" maxlength="200" :placeholder="tr('选填，200 字以内')" />
          </view>
        </view>

        <view class="apply__submit" :class="{ 'apply__submit--off': submitting }" @tap="submit">
          {{ submitting ? tr("提交中…") : tr("提交申请") }}
        </view>
        <text class="apply__tip">{{ tr("提交即表示同意平台审核与《商家合作协议》；已有申请记录的手机号不会重复创建。") }}</text>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.apply__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.apply__intro-title {
  display: block;
  font-family: $font-serif;
  font-size: 40rpx;
  font-weight: 600;
  color: $text-main;
}

.apply__intro-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-sub;
}

.apply__card {
  padding: 6rpx 24rpx;
}

.apply__row {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }
}

.apply__row--column {
  flex-direction: column;
  align-items: flex-start;
  gap: 14rpx;
}

.apply__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
  width: 140rpx;
}

.apply__row--column .apply__label {
  width: auto;
}

.apply__input {
  flex: 1;
  min-width: 0;
  font-size: 28rpx;
  color: $text-main;
  text-align: right;
}

.apply__input--full {
  width: 100%;
  text-align: left;
}

.apply__textarea {
  width: 100%;
  height: 150rpx;
  font-size: 27rpx;
  line-height: 1.7;
  color: $text-main;
}

.apply__types {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}

.apply__type {
  padding: 14rpx 26rpx;
  border-radius: 999rpx;
  background: $green-soft;
  color: $text-sub;
  font-size: 25rpx;
}

.apply__type--on {
  background: $green;
  color: #f7f3e6;
  font-weight: 600;
}

.apply__submit {
  height: 92rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
}

.apply__submit--off {
  opacity: 0.6;
}

.apply__tip {
  font-size: 22rpx;
  line-height: 1.7;
  color: $text-mute;
  padding: 0 8rpx;
}

.apply__done {
  padding: 40rpx 28rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.apply__done-title {
  font-family: $font-serif;
  font-size: 38rpx;
  font-weight: 600;
  color: $green;
}

.apply__done-desc {
  font-size: 26rpx;
  line-height: 1.75;
  color: $text-sub;
}

.apply__done-btn {
  margin-top: 12rpx;
}
</style>
