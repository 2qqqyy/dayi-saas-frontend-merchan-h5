<script setup lang="ts">
import { ref, computed } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import {
  applyWithdrawal,
  getSettlementOverview,
  getPayeeAccount,
  maskBankCard,
  type PayeeAccount,
} from "@/api/settlement";
import { formatMoney } from "@/utils/format";
import { getPublicConfigs } from "@/utils/config";
import { goBack } from "@/utils/navigation";
import { tr } from "@/utils/i18n";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import LoadingState from "@/components/LoadingState.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();


const merchantStore = useMerchantStore();

const loading = ref(true);
const submitting = ref(false);
const amountInput = ref("");
const available = ref(0);
/** 单笔最低提现金额，取自后台系统配置 withdraw.min */
const minWithdraw = ref(100);
const payee = ref<PayeeAccount>({ bankName: "", accountName: "", accountNo: "" });

/** 解析后的金额（保留 2 位小数） */
const amount = computed(() => {
  const n = Number(amountInput.value);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : 0;
});

const hasPayee = computed(
  () => Boolean(payee.value.accountNo) && Boolean(payee.value.accountName),
);

/** 校验结果：返回错误文案，通过则为空串 */
const amountError = computed(() => {
  if (!amountInput.value) return "";
  if (!(amount.value > 0)) return tr("提现金额必须大于 0");
  if (amount.value > available.value)
    return tr("超出可提现余额 ¥{amount}").replace("{amount}", formatMoney(available.value));
  if (amount.value < minWithdraw.value)
    return tr("单笔最低提现 ¥{amount}").replace("{amount}", formatMoney(minWithdraw.value));
  const parts = String(amountInput.value).split(".");
  if (parts[1] && parts[1].length > 2) return tr("最多保留两位小数");
  return "";
});

const canSubmit = computed(
  () => !submitting.value && amount.value > 0 && !amountError.value && hasPayee.value,
);

/** 快捷比例 */
const quickRatios = [
  { label: "全部", ratio: 1 },
  { label: "1/2", ratio: 0.5 },
  { label: "1/3", ratio: 1 / 3 },
];

async function load() {
  loading.value = true;
  getPublicConfigs(["withdraw.min"]).then((map) => {
    const raw = Number(map["withdraw.min"]);
    if (Number.isFinite(raw) && raw > 0) minWithdraw.value = raw;
  });
  try {
    const [ov, acc] = await Promise.all([getSettlementOverview(), getPayeeAccount()]);
    available.value = ov.data.pendingAmount;
    payee.value = acc.data;
  } catch {
    // 静默：允许用户手动输入金额，提交时再校验
    available.value = 0;
  } finally {
    loading.value = false;
  }
}

function onRatio(ratio: number) {
  if (available.value <= 0) {
    uni.showToast({ title: tr("暂无可提现余额"), icon: "none" });
    return;
  }
  amountInput.value = (Math.floor(available.value * ratio * 100) / 100).toFixed(2);
}

function onAll() {
  onRatio(1);
}

function onInput(e: Event) {
  const v = (e as unknown as { detail: { value: string } }).detail.value;
  // 只保留数字与小数点，防止 type=tel 输入非法字符
  amountInput.value = String(v).replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1");
}

async function onSubmit() {
  if (submitting.value) return;
  if (!hasPayee.value) {
    uni.showToast({ title: tr("请先补全收款账户信息"), icon: "none" });
    return;
  }
  if (amount.value <= 0) {
    uni.showToast({ title: tr("请输入提现金额"), icon: "none" });
    return;
  }
  if (amountError.value) {
    uni.showToast({ title: amountError.value, icon: "none" });
    return;
  }

  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: tr("确认提现"),
      content: tr("提现 ¥{amount} 到 {account}，提交后由平台审核打款。")
        .replace("{amount}", formatMoney(amount.value))
        .replace("{account}", maskBankCard(payee.value.accountNo)),
      confirmText: tr("确认提交"),
      success: (r) => resolve(Boolean(r.confirm)),
      fail: () => resolve(false),
    });
  });
  if (!confirmed) return;

  submitting.value = true;
  try {
    await applyWithdrawal(amount.value);
    uni.showToast({ title: tr("提现申请已提交"), icon: "success" });
    setTimeout(() => goBack(), 800);
  } catch {
    // request 拦截器已统一 toast 错误信息
  } finally {
    submitting.value = false;
  }
}

function onEditPayee() {
  uni.showToast({ title: tr("请在「商家资料」中修改收款账户"), icon: "none" });
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  load();
});
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('申请提现')" show-back show-home />

    <LoadingState v-if="loading" :rows="2" />

    <view v-else class="wd__body">
      <!-- 可提现余额 -->
      <view class="wd__available card">
        <text class="wd__available-label">{{ tr("可提现余额") }}</text>
        <view class="wd__available-amount">
          <text class="wd__available-symbol">¥</text>
          <text class="wd__available-value">{{ formatMoney(available) }}</text>
        </view>
      </view>

      <!-- 收款账户 -->
      <view class="wd__card card">
        <view class="wd__card-head">
          <text class="wd__card-title">{{ tr("收款账户") }}</text>
          <text class="wd__card-action" @tap="onEditPayee">{{ tr("修改") }}</text>
        </view>
        <template v-if="hasPayee">
          <view class="wd__row">
            <text class="wd__row-k">{{ tr("开户行") }}</text>
            <text class="wd__row-v">{{ payee.bankName || tr("未填写") }}</text>
          </view>
          <view class="wd__row">
            <text class="wd__row-k">{{ tr("户名") }}</text>
            <text class="wd__row-v">{{ payee.accountName }}</text>
          </view>
          <view class="wd__row">
            <text class="wd__row-k">{{ tr("卡号") }}</text>
            <text class="wd__row-v">{{ maskBankCard(payee.accountNo) }}</text>
          </view>
        </template>
        <view v-else class="wd__no-payee">
          {{ tr("尚未完善收款账户信息，请先在「商家资料」中填写开户行、户名与卡号") }}
        </view>
      </view>

      <!-- 提现金额 -->
      <view class="wd__card card">
        <view class="wd__card-head">
          <text class="wd__card-title">{{ tr("提现金额") }}</text>
          <text class="wd__card-action" @tap="onAll">{{ tr("全部提现") }}</text>
        </view>
        <view class="wd__amount-input" :class="{ 'wd__amount-input--error': !!amountError }">
          <text class="wd__amount-symbol">¥</text>
          <!-- type=tel 而非 number：避免 iOS/小程序对数字输入的精度截断 -->
          <input
            class="wd__amount-field"
            type="tel"
            :value="amountInput"
            :placeholder="tr('请输入提现金额')"
            placeholder-class="wd__amount-ph"
            @input="onInput"
          />
        </view>
        <text v-if="amountError" class="wd__amount-error">{{ amountError }}</text>

        <view class="wd__ratios">
          <view v-for="r in quickRatios" :key="r.label" class="wd__ratio" @tap="onRatio(r.ratio)">
            {{ tr(r.label) }}
          </view>
        </view>
      </view>

      <!-- 说明 -->
      <view class="wd__tips">
        <text class="wd__tip">· {{ tr("提现提交后由平台审核，预计 1-3 个工作日到账") }}</text>
        <text class="wd__tip">· {{ tr("单笔最低提现 ¥{amount}，可提现金额为待结算的订单净收入").replace("{amount}", formatMoney(minWithdraw)) }}</text>
        <text class="wd__tip">· {{ tr("提现记录可在「结算中心 - 提现记录」中查看进度") }}</text>
      </view>

      <view
        class="wd__submit"
        :class="canSubmit ? 'btn-primary' : 'btn-disabled'"
        @tap="onSubmit"
      >
        {{ submitting ? tr("提交中…") : tr("确认提现") }}
      </view>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.wd__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.wd__available {
  padding: 32rpx 28rpx;
  background: linear-gradient(140deg, var(--qm-deep, #1d3f2e) 0%, var(--qm-deep-2, #12291e) 100%);
  box-shadow: 0 12rpx 32rpx rgba(79, 143, 82, 0.22);
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.wd__available-label {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.85);
}

.wd__available-amount {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}

.wd__available-symbol {
  font-size: 30rpx;
  font-weight: 600;
  color: #fff;
}

.wd__available-value {
  font-size: 56rpx;
  line-height: 1.1;
  font-weight: 700;
  color: #fff;
}

.wd__card {
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.wd__card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.wd__card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: $text-main;
}

.wd__card-action {
  font-size: 24rpx;
  color: $green;
}

.wd__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.wd__row-k {
  font-size: 26rpx;
  color: $text-sub;
}

.wd__row-v {
  font-size: 26rpx;
  color: $text-main;
  font-weight: 500;
}

.wd__no-payee {
  font-size: 24rpx;
  line-height: 1.6;
  color: $text-sub;
  padding: 20rpx;
  background: $bg;
  border-radius: $radius-sm;
}

.wd__amount-input {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 108rpx;
  padding: 0 24rpx;
  border-radius: $radius-md;
  background: $bg;
  border: 2rpx solid transparent;

  &--error {
    border-color: rgba(245, 108, 108, 0.5);
    background: #fdf5f5;
  }
}

.wd__amount-symbol {
  font-size: 36rpx;
  font-weight: 700;
  color: $text-main;
}

.wd__amount-field {
  flex: 1;
  height: 100%;
  font-size: 40rpx;
  font-weight: 700;
  color: $text-main;
}

.wd__amount-ph {
  font-size: 30rpx;
  font-weight: 400;
  color: #b3bab4;
}

.wd__amount-error {
  font-size: 23rpx;
  color: $danger;
  margin-top: -8rpx;
}

.wd__ratios {
  display: flex;
  gap: 16rpx;
}

.wd__ratio {
  flex: 1;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-sm;
  background: $green-bg;
  color: $green;
  font-size: 25rpx;

  &:active {
    opacity: 0.8;
  }
}

.wd__tips {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding: 0 8rpx;
}

.wd__tip {
  font-size: 23rpx;
  line-height: 1.6;
  color: $text-sub;
}

.wd__submit {
  margin-top: 8rpx;
}
</style>
