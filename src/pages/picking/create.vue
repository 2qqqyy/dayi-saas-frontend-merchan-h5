<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import { reactive, ref } from "vue";
import dayjs from "dayjs";
import * as pickingApi from "@/api/picking";
import { goBack } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


/** 采摘园必须是当前商户名下的真实果园，不再用文本框手填名称、也不在前端兜底成 id=1 */
const orchards = ref<pickingApi.MyOrchard[]>([]);
const orchardIndex = ref(-1);

const form = reactive({
  orchardId: "",
  orchardName: "",
  // 默认取明天，避免写死日期变成过去时间导致场次一创建就过期
  date: dayjs().add(1, "day").format("YYYY-MM-DD"),
  startTime: "09:00",
  endTime: "12:00",
  adultPrice: 68,
  maxPeople: 30,
});

async function loadOrchards() {
  try {
    const res = await pickingApi.getMyOrchards();
    orchards.value = res.data;
    if (orchards.value.length === 1) {
      orchardIndex.value = 0;
      form.orchardId = orchards.value[0].id;
      form.orchardName = orchards.value[0].name;
    }
  } catch {
    uni.showToast({ title: tr("采摘园列表加载失败"), icon: "none" });
  }
}

function onOrchardChange(e: any) {
  const i = Number(e?.detail?.value);
  const o = orchards.value[i];
  if (!o) return;
  orchardIndex.value = i;
  form.orchardId = o.id;
  form.orchardName = o.name;
}

function validate(): string {
  if (!form.orchardId) return tr("请选择采摘园");
  if (!form.date) return tr("请选择日期");
  if (!form.startTime || !form.endTime) return tr("请选择时间");
  if (form.endTime <= form.startTime) return tr("结束时间需晚于开始时间");
  if (!form.adultPrice || form.adultPrice <= 0) return tr("请填写采摘单价");
  if (!form.maxPeople || form.maxPeople <= 0) return tr("请填写最大人数");
  return "";
}

async function submit(publish: boolean) {
  const err = validate();
  if (err) {
    uni.showToast({ title: err, icon: "none" });
    return;
  }
  try {
    // 草稿与发布一次请求区分开：status 0=草稿（C 端不可见）1=已发布
    await pickingApi.createPickingSession(
      {
        merchantId: "",
        orchardId: form.orchardId,
        orchardName: form.orchardName,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        adultPrice: form.adultPrice,
        maxPeople: form.maxPeople,
      },
      publish,
    );
    uni.showToast({ title: publish ? tr("已发布") : tr("已保存草稿"), icon: "success" });
    setTimeout(() => goBack(), 400);
  } catch (e: any) {
    uni.showToast({ title: e?.message || tr("保存失败"), icon: "none" });
  }
}

loadOrchards();
</script>

<template>
  <view class="form" :class="qmClass">
    <MerchantNavbar :title="tr('新增场次')" show-back show-home />
    <view class="form__card card">
      <view class="form__row">
        <text class="form__label">{{ tr("采摘园") }}</text>
        <picker
          mode="selector"
          :range="orchards"
          range-key="name"
          :value="Math.max(orchardIndex, 0)"
          @change="onOrchardChange"
        >
          <view class="form__picker">{{ form.orchardName || tr("请选择名下采摘园") }}</view>
        </picker>
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("日期") }}</text>
        <picker mode="date" :value="form.date" @change="form.date = ($event.detail as any).value">
          <view class="form__picker">{{ form.date }}</view>
        </picker>
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("开始时间") }}</text>
        <picker mode="time" :value="form.startTime" @change="form.startTime = ($event.detail as any).value">
          <view class="form__picker">{{ form.startTime }}</view>
        </picker>
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("结束时间") }}</text>
        <picker mode="time" :value="form.endTime" @change="form.endTime = ($event.detail as any).value">
          <view class="form__picker">{{ form.endTime }}</view>
        </picker>
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("采摘单价") }}</text>
        <input v-model="form.adultPrice" type="digit" class="form__input" :placeholder="tr('¥ / 人')" />
      </view>
      <view class="form__row">
        <text class="form__label">{{ tr("最大人数") }}</text>
        <input v-model="form.maxPeople" type="number" class="form__input" :placeholder="tr('人')" />
      </view>
    </view>

    <view class="form__actions">
      <view class="btn-ghost" @tap="submit(false)">{{ tr("保存草稿") }}</view>
      <view class="btn-primary" @tap="submit(true)">{{ tr("发布场次") }}</view>
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

.form__actions {
  display: flex;
  gap: 20rpx;

  .btn-primary,
  .btn-ghost {
    flex: 1;
  }
}
</style>
