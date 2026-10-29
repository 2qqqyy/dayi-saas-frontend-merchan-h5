<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { go } from "@/utils/navigation";
import { imgSrc } from "@/utils/image";
import { fmtDate, splitList, toNum, toStr } from "@/utils/backend";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";
import { getPenalties, type PenaltyRecord } from "@/api/penalty";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import EmptyState from "@/components/EmptyState.vue";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

const merchantStore = useMerchantStore();

/** 后端 merchant.auditStatus：0 待审核 / 1 通过 / 2 资料待补充 / 3 驳回 */
const AUDIT_TEXT: Record<number, string> = {
  0: "审核中",
  1: "已通过",
  2: "待补充资料",
  3: "已驳回",
};

const raw = computed<Record<string, any>>(() => (merchantStore.merchantInfo as any)?._raw ?? {});
const audit = computed(() => toNum(raw.value.auditStatus, 0));
const auditText = computed(() => tr(AUDIT_TEXT[audit.value] ?? "审核中"));
const tone = computed(() => (audit.value === 1 ? "ok" : audit.value === 3 ? "bad" : "warn"));

const rejectReason = computed(() => toStr(raw.value.rejectReason));
const rejectCount = computed(() => toNum(raw.value.rejectCount, 0));

/** 门店照片存的是逗号分隔路径，空值不占位 */
const photos = computed(() => splitList(raw.value.photoUrls).map((p) => imgSrc(p)));
const license = computed(() => (toStr(raw.value.licenseUrl) ? imgSrc(raw.value.licenseUrl) : ""));

/** 证件与卡号只做脱敏展示，完整值仍由平台侧留档 */
const idCard = computed(() => mask(toStr(raw.value.idCard), 4, 4));
const accountNo = computed(() => mask(toStr(raw.value.accountNo), 0, 4));

function mask(v: string, head: number, tail: number) {
  if (!v) return "";
  if (v.length <= head + tail) return "****";
  return `${v.slice(0, head)}${"*".repeat(Math.min(8, v.length - head - tail))}${v.slice(v.length - tail)}`;
}

function preview(urls: string[], current: string) {
  if (!urls.length) return;
  uni.previewImage({ urls, current });
}

const penalties = ref<PenaltyRecord[]>([]);
const penaltyPoints = ref(0);
const suspended = ref(false);

const PENALTY_TEXT: Record<string, string> = { WARNING: "警告", DEDUCT: "扣分", SUSPEND: "暂停营业" };
const PENALTY_STATUS: Record<number, string> = { 0: "已撤销", 1: "生效中", 3: "已结束" };

async function loadPenalties() {
  const res = await getPenalties();
  penalties.value = res.data.list;
  penaltyPoints.value = res.data.points;
  suspended.value = res.data.suspended;
}

onShow(() => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  merchantStore.fetchMerchantInfo();
  loadPenalties();
});
</script>

<template>
  <view class="qf" :class="qmClass">
    <MerchantNavbar :title="tr('资质与审核')" show-back show-home />

    <view class="qf__body">
      <EmptyState v-if="!raw.id" :title="tr('未获取到商家信息')" :description="tr('请稍后重试或重新登录')" />
      <template v-else>
        <!-- 审核结论 -->
        <view class="qf__hero card">
          <view class="qf__hero-top">
            <text class="qf__badge" :class="`qf__badge--${tone}`">{{ auditText }}</text>
            <text class="qf__no">{{ tr("商家编号：") }}{{ merchantStore.merchantInfo?.merchantNo || "-" }}</text>
          </view>
          <text class="qf__name">{{ merchantStore.merchantInfo?.name }}</text>
          <view class="qf__steps">
            <view class="qf__step">
              <view class="qf__step-dot qf__step-dot--done" />
              <view class="qf__step-text">
                <text class="qf__step-title">{{ tr("提交入驻资料") }}</text>
                <text class="qf__step-time">{{ fmtDate(raw.createTime) || "-" }}</text>
              </view>
            </view>
            <view class="qf__step">
              <view class="qf__step-dot" :class="{ 'qf__step-dot--done': audit !== 0 }" />
              <view class="qf__step-text">
                <text class="qf__step-title">{{ tr("平台审核") }}</text>
                <text class="qf__step-time">{{ audit === 0 ? tr("预计 1-3 个工作日") : fmtDate(raw.updateTime) || "-" }}</text>
              </view>
            </view>
            <view class="qf__step">
              <view class="qf__step-dot" :class="{ 'qf__step-dot--done': audit === 1 }" />
              <view class="qf__step-text">
                <text class="qf__step-title">{{ tr("开通收款与上架") }}</text>
                <text class="qf__step-time">{{ audit === 1 ? tr("已开通") : tr("审核通过后开通") }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 驳回说明 -->
        <view v-if="audit === 3" class="qf__reject card">
          <text class="qf__reject-title">{{ tr("驳回原因") }}</text>
          <text class="qf__reject-text">{{ rejectReason || tr("平台未填写具体原因，请补充营业执照与门店照片后重新提交") }}</text>
          <text class="qf__reject-count">{{ tr("已驳回 {n} 次").replace("{n}", String(rejectCount)) }}</text>
          <view class="qf__reject-btn" @tap="go('pages/user/profile')">{{ tr("去修改资料") }}</view>
        </view>

        <!-- 主体信息 -->
        <view class="qf__section">
          <text class="qf__h">{{ tr("主体信息") }}</text>
          <view class="qf__card card">
            <view class="qf__row">
              <text class="qf__label">{{ tr("商户名称") }}</text>
              <text class="qf__value">{{ toStr(raw.name) || "-" }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("联系人") }}</text>
              <text class="qf__value">{{ toStr(raw.contact) || "-" }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("联系电话") }}</text>
              <text class="qf__value">{{ toStr(raw.mobile) || "-" }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("经营地址") }}</text>
              <text class="qf__value">{{ toStr(raw.address) || tr("未填写") }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("经营范围") }}</text>
              <text class="qf__value">{{ toStr(raw.businessScope) || tr("未填写") }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("身份证号") }}</text>
              <text class="qf__value">{{ idCard || tr("未填写") }}</text>
            </view>
          </view>
        </view>

        <!-- 资质材料 -->
        <view class="qf__section">
          <text class="qf__h">{{ tr("资质材料") }}</text>
          <view class="qf__card card">
            <view class="qf__media">
              <view v-if="license" class="qf__media-item" @tap="preview([license], license)">
                <image class="qf__media-img" :src="license" mode="aspectFill" />
                <text class="qf__media-label">{{ tr("营业执照") }}</text>
              </view>
              <view v-else class="qf__media-item">
                <view class="qf__media-empty"><text>{{ tr("未上传") }}</text></view>
                <text class="qf__media-label">{{ tr("营业执照") }}</text>
              </view>
              <view
                v-for="(p, i) in photos"
                :key="i"
                class="qf__media-item"
                @tap="preview(photos, p)"
              >
                <image class="qf__media-img" :src="p" mode="aspectFill" />
                <text class="qf__media-label">{{ tr("门店照片 {n}").replace("{n}", String(i + 1)) }}</text>
              </view>
            </view>
            <text class="qf__hint">{{ tr("点击缩略图可放大查看；更换材料请在「商家资料」中提交，由平台重新审核") }}</text>
          </view>
        </view>

        <!-- 结算账户 -->
        <view class="qf__section">
          <text class="qf__h">{{ tr("结算账户") }}</text>
          <view class="qf__card card">
            <view class="qf__row">
              <text class="qf__label">{{ tr("开户行") }}</text>
              <text class="qf__value">{{ toStr(raw.bankName) || tr("未填写") }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("户名") }}</text>
              <text class="qf__value">{{ toStr(raw.accountName) || tr("未填写") }}</text>
            </view>
            <view class="qf__row">
              <text class="qf__label">{{ tr("卡号") }}</text>
              <text class="qf__value">{{ accountNo || tr("未填写") }}</text>
            </view>
            <view class="qf__row qf__row--link" @tap="go('pages/settlement/index')">
              <text class="qf__label">{{ tr("可提现余额") }}</text>
              <text class="qf__arrow">›</text>
            </view>
          </view>
        </view>

        <!-- 违规与处罚 -->
        <view class="qf__section">
          <text class="qf__h">{{ tr("违规与处罚") }}</text>
          <view class="qf__card card">
            <view class="qf__row">
              <text class="qf__label">{{ tr("累计扣分") }}</text>
              <text class="qf__value">{{ penaltyPoints }}</text>
            </view>
            <view v-if="suspended" class="qf__row">
              <text class="qf__label">{{ tr("营业状态") }}</text>
              <text class="qf__value qf__value--bad">{{ tr("暂停营业中") }}</text>
            </view>
            <view v-if="!penalties.length" class="qf__penalty-empty">
              <text>{{ tr("暂无处罚记录") }}</text>
            </view>
            <view v-for="p in penalties" :key="p.id" class="qf__penalty">
              <view class="qf__penalty-top">
                <text class="qf__penalty-type">{{ tr(PENALTY_TEXT[p.type] || p.type) }}{{ p.points ? " -" + p.points : "" }}</text>
                <text class="qf__penalty-status">{{ tr(PENALTY_STATUS[p.status] || "-") }}</text>
              </view>
              <text class="qf__penalty-reason">{{ p.reason }}</text>
              <text class="qf__penalty-time">{{ (p.createTime || "").slice(0, 16).replace("T", " ") }}</text>
            </view>
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.qf__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 26rpx;
}

.qf__hero {
  padding: 28rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.qf__hero-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.qf__badge {
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  font-size: 23rpx;
  font-weight: 600;
}

.qf__badge--ok {
  background: $green-bg;
  color: $green;
}

.qf__badge--warn {
  background: $yellow-soft;
  color: $yellow-deep;
}

.qf__badge--bad {
  background: rgba(168, 66, 47, 0.12);
  color: $danger;
}

.qf__no {
  font-size: 22rpx;
  color: $text-mute;
}

.qf__name {
  font-family: $font-serif;
  font-size: 38rpx;
  font-weight: 600;
  color: $text-main;
}

.qf__steps {
  margin-top: 6rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.qf__step {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.qf__step-dot {
  width: 18rpx;
  height: 18rpx;
  margin-top: 8rpx;
  border-radius: 50%;
  background: $disabled;
  flex-shrink: 0;
}

.qf__step-dot--done {
  background: $green;
  box-shadow: 0 0 0 6rpx rgba(46, 94, 68, 0.14);
}

.qf__step-text {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.qf__step-title {
  font-size: 26rpx;
  color: $text-main;
}

.qf__step-time {
  font-size: 22rpx;
  color: $text-mute;
}

.qf__reject {
  padding: 26rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  border-color: rgba(168, 66, 47, 0.28);
}

.qf__reject-title {
  font-size: 27rpx;
  font-weight: 700;
  color: $danger;
}

.qf__reject-text {
  font-size: 25rpx;
  line-height: 1.7;
  color: $text-main;
}

.qf__reject-count {
  font-size: 22rpx;
  color: $text-mute;
}

.qf__reject-btn {
  margin-top: 4rpx;
  height: 76rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $green;
  color: #f7f3e6;
  font-size: 27rpx;
  font-weight: 600;
}

.qf__section {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.qf__h {
  font-size: 25rpx;
  color: $text-sub;
  padding-left: 8rpx;
}

.qf__card {
  padding: 6rpx 24rpx;
}

.qf__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  padding: 24rpx 0;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }
}

.qf__label {
  font-size: 26rpx;
  color: $text-sub;
  flex-shrink: 0;
}

.qf__value {
  flex: 1;
  min-width: 0;
  text-align: right;
  font-size: 26rpx;
  color: $text-main;
  word-break: break-all;
}

.qf__arrow {
  font-size: 32rpx;
  color: $text-mute;
}

.qf__media {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
  padding: 22rpx 0 6rpx;
}

.qf__media-item {
  width: calc((100% - 36rpx) / 3);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.qf__media-img,
.qf__media-empty {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: $radius-md;
  background: $img-bg;
}

.qf__media-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx dashed $line;
  font-size: 22rpx;
  color: $text-mute;
}

.qf__media-label {
  font-size: 21rpx;
  color: $text-sub;
}

.qf__hint {
  display: block;
  padding: 6rpx 0 22rpx;
  font-size: 21rpx;
  line-height: 1.6;
  color: $text-mute;
}
.qf__value--bad {
  color: $danger;
}

.qf__penalty-empty {
  padding: 20rpx 0;
  text-align: center;
  font-size: 23rpx;
  color: $text-mute;
}

.qf__penalty {
  padding: 18rpx 0;
  border-top: 1rpx solid $line-2;
}

.qf__penalty-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qf__penalty-type {
  font-size: 25rpx;
  font-weight: 700;
  color: $danger;
}

.qf__penalty-status {
  font-size: 21rpx;
  color: $text-mute;
}

.qf__penalty-reason {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  color: $text-main;
  line-height: 1.6;
}

.qf__penalty-time {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: $text-mute;
}

</style>
