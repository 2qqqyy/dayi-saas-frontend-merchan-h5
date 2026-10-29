<script setup lang="ts">
import MerchantNavbar from "@/components/MerchantNavbar.vue";
import VerifyPanel from "@/components/VerifyPanel.vue";
import { tr } from "@/utils/i18n";
import { useQmClass } from "@/composables/useQmClass";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();

</script>

<template>
  <view class="verify-page" :class="qmClass">
    <MerchantNavbar :title="tr('订单核销')" show-back show-home />
    <VerifyPanel />
  </view>
</template>

<style lang="scss" scoped>
.verify-page {
  min-height: 100vh;
  background: $bg;
}
</style>
