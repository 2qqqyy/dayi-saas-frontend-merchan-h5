<script setup lang="ts">
import { computed, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { useMerchantStore } from "@/stores/merchant";
import { go } from "@/utils/navigation";
import { imgSrc } from "@/utils/image";
import { getPublicConfigs } from "@/utils/config";
import { getNoticeUnread } from "@/api/notice";
import { useQmPalette } from "@/composables/useQmPalette";
import { tr } from "@/utils/i18n";
import type { CertStatus } from "@/types/business";
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import MerchantTabBar from "@/components/MerchantTabBar.vue";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();
const palette = useQmPalette();


const merchantStore = useMerchantStore();

/** 认证状态：不再写死「已认证」，跟随后端 auditStatus 映射 */
const CERT_TEXT: Record<CertStatus, string> = {
  CERTIFIED: "已认证",
  PENDING: "审核中",
  REJECTED: "未通过",
};

const certStatus = computed<CertStatus>(() => merchantStore.merchantInfo?.certStatus ?? "PENDING");
const certText = computed(() => tr(CERT_TEXT[certStatus.value]));

/** 开关绑定本地状态而非 store，写库失败时能真正回滚视图 */
const open = ref(true);
const statusSaving = ref(false);

/** 客服热线跟随后台「系统配置」contact_phone，与 C 端保持同一个号码 */
const hotline = ref("400-888-8888");

/** 平台公告未读数：后端 notice_read 表统计，不是本地标记 */
const noticeUnread = ref(0);

onShow(async () => {
  if (!merchantStore.isLogin) {
    uni.reLaunch({ url: "/pages/user/login" });
    return;
  }
  getPublicConfigs(["contact_phone"]).then((map) => {
    const raw = (map["contact_phone"] || "").trim();
    if (raw) hotline.value = raw;
  });
  getNoticeUnread()
    .then((n) => (noticeUnread.value = n))
    .catch(() => {});
  await merchantStore.fetchMerchantInfo();
  open.value = merchantStore.merchantInfo?.status !== "CLOSED";
});

async function onStatusChange(e: Event) {
  if (statusSaving.value) return;
  const value = (e as unknown as { detail: { value: boolean } }).detail.value;
  statusSaving.value = true;
  const ok = await merchantStore.updateStatus(value ? "OPEN" : "CLOSED");
  statusSaving.value = false;
  if (!ok) {
    // 后端未生效时把开关拨回原值，避免界面显示「营业中」而库里已是歇业
    open.value = !value;
    uni.showToast({ title: tr("状态未更新，请重试"), icon: "none" });
    return;
  }
  open.value = value;
  uni.showToast({ title: value ? tr("已切换为营业中") : tr("已暂停营业"), icon: "none" });
}

function onMenu(key: string) {
  if (key === "profile") go("pages/user/profile");
  else if (key === "qualification") go("pages/user/qualification");
  else if (key === "notice") go("pages/notice/index");
  else if (key === "display") go("pages/user/display");
  else if (key === "review") go("pages/review/index");
  else if (key === "ticket") go("pages/ticket/index");
  else if (key === "settlement") go("pages/settlement/index");
  else if (key === "security") go("pages/user/settings");
  else if (key === "message") go("pages/message/index");
  else if (key === "help")
    uni.showModal({
      title: tr("帮助中心"),
      content:
        tr("商家经营问题可在「订单」处理单据、「结算」申请提现。") +
        "\n" +
        tr("客服热线：") +
        hotline.value +
        tr("（每日 08:30 - 20:00）"),
      confirmText: tr("知道了"),
      showCancel: false,
    });
}

function onLogout() {
  uni.showModal({
    title: tr("提示"),
    content: tr("确定退出登录吗？"),
    success: async (res) => {
      if (!res.confirm) return;
      await merchantStore.logout();
      uni.reLaunch({ url: "/pages/user/login" });
    },
  });
}
</script>

<template>
  <view class="page" :class="qmClass">
    <MerchantNavbar :title="tr('我的')" />

    <view class="user__body">
      <!-- 商家信息 -->
      <view class="user__profile card" @tap="go('pages/user/profile')">
        <image class="user__avatar" :src="imgSrc(merchantStore.merchantInfo?.avatar)" mode="aspectFill" />
        <view class="user__info">
          <view class="user__name-row">
            <text class="user__name">{{ merchantStore.merchantInfo?.name || tr("未获取到商家信息") }}</text>
            <text class="user__cert" :class="`user__cert--${certStatus.toLowerCase()}`">{{ certText }}</text>
          </view>
          <text class="user__no">{{ tr("商家编号：") }}{{ merchantStore.merchantInfo?.merchantNo || "-" }}</text>
        </view>
      </view>

      <!-- 营业状态 -->
      <view class="user__menu card">
        <view class="user__row">
          <view class="user__row-left">
            <text class="user__row-title">{{ tr("营业状态") }}</text>
            <text class="user__row-sub">{{ statusSaving ? tr("保存中…") : open ? tr("营业中") : tr("暂停营业中") }}</text>
          </view>
          <switch
            :checked="open"
            :disabled="statusSaving"
            :color="palette.primary"
            @change="onStatusChange"
          />
        </view>
      </view>

      <!-- 功能列表 -->
      <view class="user__menu card">
        <view class="user__row" @tap="onMenu('settlement')">
          <text class="user__row-title">{{ tr("结算中心") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('profile')">
          <text class="user__row-title">{{ tr("商家资料") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('qualification')">
          <text class="user__row-title">{{ tr("资质与审核") }}</text>
          <text class="user__row-sub-inline">{{ certText }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('ticket')">
          <text class="user__row-title">{{ tr("售后工单") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('review')">
          <text class="user__row-title">{{ tr("游客评价") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('notice')">
          <text class="user__row-title">{{ tr("平台公告") }}</text>
          <text v-if="noticeUnread" class="user__badge">{{ noticeUnread > 99 ? "99+" : noticeUnread }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('security')">
          <text class="user__row-title">{{ tr("账号安全") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('message')">
          <text class="user__row-title">{{ tr("消息设置") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('display')">
          <text class="user__row-title">{{ tr("外观") }}</text>
          <text class="user__row-sub-inline">{{ tr("主题 · 关怀模式 · 明暗 · 语言") }}</text>
          <text class="user__arrow">›</text>
        </view>
        <view class="user__row" @tap="onMenu('help')">
          <text class="user__row-title">{{ tr("帮助中心") }}</text>
          <text class="user__arrow">›</text>
        </view>
      </view>

      <view class="user__logout btn-ghost" @tap="onLogout">{{ tr("退出登录") }}</view>
    </view>

    <MerchantTabBar current="user" />
  </view>
</template>

<style lang="scss" scoped>
.user__body {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.user__profile {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 24rpx;
}

.user__avatar {
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: $green-bg;
}

.user__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user__name-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.user__name {
  font-size: 34rpx;
  font-weight: 700;
  color: $text-main;
}

.user__cert {
  font-size: 22rpx;
  color: $green;
  background: $green-bg;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;

  &--pending {
    color: $warning;
    background: #fdf1e3;
  }

  &--rejected {
    color: $danger;
    background: var(--qm-danger-bg, #f5e3dd);
  }
}

.user__no {
  font-size: 24rpx;
  color: $text-sub;
}

.user__menu {
  padding: 0 24rpx;
}

.user__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 0;
  border-bottom: 1rpx solid $line-2;

  &:last-child {
    border-bottom: none;
  }
}

.user__row-left {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.user__row-title {
  font-size: 28rpx;
  color: $text-main;
}

.user__row-sub {
  font-size: 22rpx;
  color: $text-sub;
}

.user__arrow {
  font-size: 32rpx;
  color: #c0c6c1;
}

.user__logout {
  margin-top: 16rpx;
}

.user__row-title {
  flex: 1;
  min-width: 0;
}

.user__row-sub-inline {
  font-size: 22rpx;
  color: $text-mute;
  margin-right: 12rpx;
}

.user__badge {
  min-width: 34rpx;
  height: 34rpx;
  padding: 0 9rpx;
  margin-right: 12rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $price;
  color: #fff;
  font-size: 20rpx;
  font-weight: 600;
}
</style>
