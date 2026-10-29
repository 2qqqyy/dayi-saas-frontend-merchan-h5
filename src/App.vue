<script setup lang="ts">
import { onLaunch, onShow, onPageNotFound } from "@dcloudio/uni-app";
import { useAppStore } from "@/stores/app";
import { applyPrefs, cacheThemes, fetchThemes, loadPrefs } from "@/utils/appearance";

// #ifdef MP-WEIXIN
onPageNotFound(() => {
  uni.reLaunch({ url: "/pages/common/error" });
});
// #endif

onLaunch(() => {
  applyPrefs(loadPrefs());
  // 主题表由后台下发，取到后缓存到本地，供下次冷启动即时应用
  fetchThemes()
    .then((list) => {
      if (list.length) {
        cacheThemes(list);
        applyPrefs(loadPrefs());
      }
    })
    .catch(() => {});
  const appStore = useAppStore();
  const sys = uni.getSystemInfoSync();
  appStore.setSafeArea(sys.statusBarHeight ?? 0, sys.safeAreaInsets?.bottom ?? 0);
});

onShow(() => {
  applyPrefs(loadPrefs());
});
</script>

<style lang="scss">
body {
  background-color: $bg;
}

page {
  max-width: $app-max-width;
  margin: 0 auto;
  background-color: $bg;
  color: $text-main;
  font-size: 28rpx;
  line-height: 1.6;
  box-shadow: 0 0 60rpx rgba(38, 53, 42, 0.08);
}

view,
text,
image,
scroll-view,
button,
input,
textarea {
  box-sizing: border-box;
}

.page {
  min-height: 100vh;
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.card {
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  border-radius: $radius-lg;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(18px) saturate(165%);
  -webkit-backdrop-filter: blur(18px) saturate(165%);
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green;
  color: #f7f3e6;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
}

.btn-primary:active {
  opacity: 0.85;
  transform: scale(0.98);
}

.btn-ghost {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $green-soft;
  color: $text-main;
  font-size: 30rpx;
  font-weight: 600;
  border: 1rpx solid $line;
}

.btn-disabled {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 88rpx;
  border-radius: $radius-lg;
  background: $disabled;
  color: $text-mute;
  font-size: 30rpx;
  font-weight: 600;
  border: none;
}

.btn-sm {
  height: 64rpx;
  padding: 0 28rpx;
  border-radius: $radius-md;
  font-size: 26rpx;
}

.text-sub {
  color: $text-sub;
}

.text-green {
  color: $green;
}

.text-danger {
  color: $danger;
}

.text-warning {
  color: $warning;
}
page {
  background-color: $canvas-a;
  background-image:
    radial-gradient(120% 55% at 8% 0%, rgba(var(--qm-accent-rgb), 0.55) 0%, rgba(201, 219, 154, 0) 58%),
    radial-gradient(95% 50% at 96% 10%, rgba(var(--qm-light-rgb), 0.42) 0%, rgba(120, 174, 150, 0) 62%),
    radial-gradient(120% 60% at 50% 104%, rgba(var(--qm-canvas-c-rgb), 0.85) 0%, rgba(var(--qm-canvas-c-rgb), 0) 66%);
  background-attachment: fixed;
}

/* ================= Liquid Glass ================= */
.glass {
  background: $glass-1;
  border: 1rpx solid $glass-edge;
  box-shadow: $glass-shadow;
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
}
.glass-soft {
  background: $glass-2;
  border: 1rpx solid $glass-edge-soft;
  box-shadow: 0 18rpx 50rpx -34rpx rgba(16, 36, 26, 0.4), inset 0 2rpx 0 rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(16px) saturate(160%);
  -webkit-backdrop-filter: blur(16px) saturate(160%);
}
.glass-dark {
  background: $glass-dark;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 30rpx 70rpx -30rpx rgba(8, 18, 12, 0.6), inset 0 2rpx 0 rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(24px) saturate(150%);
  -webkit-backdrop-filter: blur(24px) saturate(150%);
}
@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: rgba(255, 255, 255, 0.86); }
  .glass-soft { background: rgba(255, 255, 255, 0.74); }
  .glass-dark { background: rgba(16, 36, 26, 0.9); }
}

/* ================= 外观偏好（主题 / 关怀模式 / 明暗） =================
 * 颜色令牌在 uni.scss 里全部走 var(--qm-*)，这里只负责给变量赋值：
 * 默认青梅绿，切主题时由 .qm-theme-* 覆盖同一组变量，H5 与小程序都生效。
 */
/* #ifdef H5 */
html {
  --qm-cream: #fbfbf9;
  --qm-paper: #ffffff;
  --qm-surface: #ffffff;
  --qm-ink: #1b241d;
  --qm-ink-soft: #1e2326;
  --qm-primary: #2f5d43;
  --qm-deep: #1d3f2e;
  --qm-light: #7a9c86;
  --qm-soft: #eaf0ec;
  --qm-soft-2: #f3f6f4;
  --qm-accent: #c9db9a;
  --qm-price: #b4552f;
  --qm-success: #3f6b4c;
  --qm-success-bg: rgba(63, 107, 76, 0.12);
  --qm-warning: #a97a2c;
  --qm-warning-bg: #f6ecd6;
  --qm-danger: #a8422f;
  --qm-danger-bg: #f5e3dd;
  --qm-info: #6b7268;
  --qm-info-bg: #eeeadf;
  --qm-text-main: #1b241d;
  --qm-text-sub: #5c665e;
  --qm-text-mute: #8a938b;
  --qm-line: rgba(27, 36, 29, 0.1);
  --qm-line-2: rgba(27, 36, 29, 0.06);
  --qm-line-strong: rgba(27, 36, 29, 0.18);
  --qm-border: rgba(27, 36, 29, 0.1);
  --qm-disabled: #d7d9d8;
  --qm-img-bg: #efefec;
  --qm-yellow: #cdb98a;
  --qm-yellow-deep: #57462a;
  --qm-yellow-soft: #f6f1e6;
  --qm-brown: #7a6a55;
  --qm-brown-soft: #f1ede6;
  --qm-bg: #fbfbf9;
  --qm-glass-1: rgba(255, 255, 255, 0.58);
  --qm-glass-2: rgba(255, 255, 255, 0.42);
  --qm-glass-3: rgba(255, 255, 255, 0.72);
  --qm-glass-dark: rgba(16, 36, 26, 0.62);
  --qm-glass-edge: rgba(255, 255, 255, 0.72);
  --qm-glass-edge-soft: rgba(255, 255, 255, 0.42);
  --qm-canvas-a: #e7efe4;
  --qm-canvas-b: #dfe9e6;
  --qm-canvas-c: #f2ede1;
  --qm-primary-rgb: 46, 94, 68;
  --qm-deep-rgb: 29, 63, 46;
  --qm-light-rgb: 122, 156, 134;
  --qm-accent-rgb: 201, 219, 154;
  --qm-canvas-c-rgb: 244, 238, 220;
  --qm-deep-2: #12291E;
  --qm-zoom: 1;
}
/* #endif */

.qm-theme-forest {
  --qm-primary: #2f5d43;
  --qm-deep: #1b3a29;
  --qm-light: #71906a;
  --qm-accent: #c8de84;
  --qm-soft: #f2f6ec;
  --qm-soft-2: #e9efe1;
  --qm-canvas-a: #e9efe1;
  --qm-canvas-b: #f2f6ec;
  --qm-price: #b4552f;
  --qm-primary-rgb: 47, 93, 67;
  --qm-deep-rgb: 27, 58, 41;
  --qm-light-rgb: 113, 144, 106;
  --qm-accent-rgb: 200, 222, 132;
  --qm-deep-2: #12291E;
  --qm-icon-filter: none;
}

.qm-theme-spring {
  --qm-primary: #2f6470;
  --qm-deep: #1b3f49;
  --qm-light: #6f98a0;
  --qm-accent: #bfe0d6;
  --qm-soft: #f1f7f7;
  --qm-soft-2: #e4eff0;
  --qm-canvas-a: #e4eff0;
  --qm-canvas-b: #f1f7f7;
  --qm-price: #a85a3c;
  --qm-primary-rgb: 47, 100, 112;
  --qm-deep-rgb: 27, 63, 73;
  --qm-light-rgb: 111, 152, 160;
  --qm-accent-rgb: 191, 224, 214;
  --qm-deep-2: #12292F;
  --qm-icon-filter: hue-rotate(45deg) saturate(1.05);
}

.qm-theme-clay {
  --qm-primary: #8a4d35;
  --qm-deep: #5a2f1e;
  --qm-light: #b08468;
  --qm-accent: #f0c9a8;
  --qm-soft: #fbf3ec;
  --qm-soft-2: #f4e7dc;
  --qm-canvas-a: #f4e7dc;
  --qm-canvas-b: #fbf3ec;
  --qm-price: #9c4f2a;
  --qm-primary-rgb: 138, 77, 53;
  --qm-deep-rgb: 90, 47, 30;
  --qm-light-rgb: 176, 132, 104;
  --qm-accent-rgb: 240, 201, 168;
  --qm-deep-2: #3E1F13;
  --qm-icon-filter: hue-rotate(-129deg) saturate(1.1);
}

.qm-theme-plum {
  --qm-primary: #6b4b63;
  --qm-deep: #3f2b3b;
  --qm-light: #94718a;
  --qm-accent: #e6c9dc;
  --qm-soft: #f9f2f7;
  --qm-soft-2: #f1e4ed;
  --qm-canvas-a: #f1e4ed;
  --qm-canvas-b: #f9f2f7;
  --qm-price: #a8552f;
  --qm-primary-rgb: 107, 75, 99;
  --qm-deep-rgb: 63, 43, 59;
  --qm-light-rgb: 148, 113, 138;
  --qm-accent-rgb: 230, 201, 220;
  --qm-deep-2: #2A1B27;
  --qm-icon-filter: hue-rotate(169deg) saturate(1.05);
}

.qm-theme-indigo {
  --qm-primary: #3c5175;
  --qm-deep: #202e45;
  --qm-light: #7589aa;
  --qm-accent: #c9d6ee;
  --qm-soft: #f2f5fa;
  --qm-soft-2: #e5ebf5;
  --qm-canvas-a: #e5ebf5;
  --qm-canvas-b: #f2f5fa;
  --qm-price: #b0552f;
  --qm-primary-rgb: 60, 81, 117;
  --qm-deep-rgb: 32, 46, 69;
  --qm-light-rgb: 117, 137, 170;
  --qm-accent-rgb: 201, 214, 238;
  --qm-deep-2: #131C2B;
  --qm-icon-filter: hue-rotate(72deg) saturate(1.05);
}

.qm-theme-gold {
  --qm-primary: #8a6224;
  --qm-deep: #4e3612;
  --qm-light: #b79355;
  --qm-accent: #efd79b;
  --qm-soft: #fbf6e8;
  --qm-soft-2: #f4eacd;
  --qm-canvas-a: #f4eacd;
  --qm-canvas-b: #fbf6e8;
  --qm-price: #a8552f;
  --qm-primary-rgb: 138, 98, 36;
  --qm-deep-rgb: 78, 54, 18;
  --qm-light-rgb: 183, 147, 85;
  --qm-accent-rgb: 239, 215, 155;
  --qm-deep-2: #2E1F0A;
  --qm-icon-filter: hue-rotate(-110deg) saturate(1.1);
}

.qm-theme-rose {
  --qm-primary: #96566a;
  --qm-deep: #582f3c;
  --qm-light: #be8b9a;
  --qm-accent: #f0cdd7;
  --qm-soft: #fbf2f5;
  --qm-soft-2: #f4e3e8;
  --qm-canvas-a: #f4e3e8;
  --qm-canvas-b: #fbf2f5;
  --qm-price: #a8552f;
  --qm-primary-rgb: 150, 86, 106;
  --qm-deep-rgb: 88, 47, 60;
  --qm-light-rgb: 190, 139, 154;
  --qm-accent-rgb: 240, 205, 215;
  --qm-deep-2: #2E1820;
  --qm-icon-filter: hue-rotate(195deg) saturate(1.05);
}

/* 深色：底、字、玻璃、描边一起换，避免只改背景的假深色 */
.qm-mode-dark {
  --qm-cream: #0e1712;
  --qm-paper: #16211b;
  --qm-surface: #16211b;
  --qm-ink: #eef3ee;
  --qm-ink-soft: #dfe7e1;
  --qm-text-main: #eef3ee;
  --qm-text-sub: rgba(238, 243, 238, 0.68);
  --qm-text-mute: rgba(238, 243, 238, 0.48);
  --qm-bg: #0e1712;
  --qm-line: rgba(255, 255, 255, 0.14);
  --qm-line-2: rgba(255, 255, 255, 0.08);
  --qm-line-strong: rgba(255, 255, 255, 0.22);
  --qm-border: rgba(255, 255, 255, 0.14);
  --qm-disabled: #3a463f;
  --qm-img-bg: #1b2620;
  --qm-soft: rgba(255, 255, 255, 0.06);
  --qm-soft-2: rgba(255, 255, 255, 0.04);
  --qm-yellow-soft: rgba(255, 255, 255, 0.05);
  --qm-brown-soft: rgba(255, 255, 255, 0.05);
  --qm-yellow-deep: #e6d7b4;
  --qm-brown: #cbbfae;
  --qm-glass-1: rgba(255, 255, 255, 0.07);
  --qm-glass-2: rgba(255, 255, 255, 0.04);
  --qm-glass-3: rgba(255, 255, 255, 0.1);
  --qm-glass-edge: rgba(255, 255, 255, 0.14);
  --qm-glass-edge-soft: rgba(255, 255, 255, 0.08);
  --qm-accent-rgb: 26, 40, 33;
  --qm-light-rgb: 22, 34, 28;
  --qm-canvas-c-rgb: 16, 26, 21;
  --qm-canvas-a: #0d1511;
  --qm-canvas-b: #101c16;
  --qm-canvas-c: #131c18;
  --qm-success: #9dc3a4;
  --qm-success-bg: rgba(157, 195, 164, 0.14);
  --qm-warning: #e0b96a;
  --qm-warning-bg: rgba(224, 185, 106, 0.14);
  --qm-danger: #e39282;
  --qm-danger-bg: rgba(227, 146, 130, 0.15);
  --qm-info: #aab3ab;
  --qm-info-bg: rgba(255, 255, 255, 0.08);
}

.qm-mode-dark .card,
.qm-mode-dark .glass,
.qm-mode-dark .glass-soft {
  box-shadow: 0 24rpx 64rpx -34rpx rgba(0, 0, 0, 0.6), inset 0 2rpx 0 rgba(255, 255, 255, 0.06);
}

/* 关怀模式：整页放大 + 加粗 + 高对比 */
.qm-elder {
  --qm-zoom: 1.18;
  --qm-text-main: #000000;
  --qm-text-sub: #35403a;
  --qm-line: rgba(27, 36, 29, 0.24);
  --qm-line-2: rgba(27, 36, 29, 0.14);
  --qm-line-strong: rgba(27, 36, 29, 0.34);
}

.qm-mode-dark.qm-elder {
  --qm-text-main: #ffffff;
  --qm-text-sub: rgba(255, 255, 255, 0.82);
  --qm-line: rgba(255, 255, 255, 0.26);
  --qm-line-2: rgba(255, 255, 255, 0.16);
}

.qm-elder .btn-primary,
.qm-elder .btn-ghost {
  font-weight: 700;
  height: 100rpx;
}

.tabbar__img,
.quick__icon-img {
  filter: var(--qm-icon-filter, none);
}

/* #ifndef H5 */
.qm-root {
  --qm-cream: #fbfbf9;
  --qm-paper: #ffffff;
  --qm-surface: #ffffff;
  --qm-ink: #1b241d;
  --qm-ink-soft: #1e2326;
  --qm-primary: #2f5d43;
  --qm-deep: #1d3f2e;
  --qm-light: #7a9c86;
  --qm-soft: #eaf0ec;
  --qm-soft-2: #f3f6f4;
  --qm-accent: #c9db9a;
  --qm-price: #b4552f;
  --qm-success: #3f6b4c;
  --qm-success-bg: rgba(63, 107, 76, 0.12);
  --qm-warning: #a97a2c;
  --qm-warning-bg: #f6ecd6;
  --qm-danger: #a8422f;
  --qm-danger-bg: #f5e3dd;
  --qm-info: #6b7268;
  --qm-info-bg: #eeeadf;
  --qm-text-main: #1b241d;
  --qm-text-sub: #5c665e;
  --qm-text-mute: #8a938b;
  --qm-line: rgba(27, 36, 29, 0.1);
  --qm-line-2: rgba(27, 36, 29, 0.06);
  --qm-line-strong: rgba(27, 36, 29, 0.18);
  --qm-border: rgba(27, 36, 29, 0.1);
  --qm-disabled: #d7d9d8;
  --qm-img-bg: #efefec;
  --qm-yellow: #cdb98a;
  --qm-yellow-deep: #57462a;
  --qm-yellow-soft: #f6f1e6;
  --qm-brown: #7a6a55;
  --qm-brown-soft: #f1ede6;
  --qm-bg: #fbfbf9;
  --qm-glass-1: rgba(255, 255, 255, 0.58);
  --qm-glass-2: rgba(255, 255, 255, 0.42);
  --qm-glass-3: rgba(255, 255, 255, 0.72);
  --qm-glass-dark: rgba(16, 36, 26, 0.62);
  --qm-glass-edge: rgba(255, 255, 255, 0.72);
  --qm-glass-edge-soft: rgba(255, 255, 255, 0.42);
  --qm-canvas-a: #e7efe4;
  --qm-canvas-b: #dfe9e6;
  --qm-canvas-c: #f2ede1;
  --qm-primary-rgb: 46, 94, 68;
  --qm-deep-rgb: 29, 63, 46;
  --qm-light-rgb: 122, 156, 134;
  --qm-accent-rgb: 201, 219, 154;
  --qm-canvas-c-rgb: 244, 238, 220;
  --qm-deep-2: #12291E;
  --qm-icon-filter: none;
  zoom: var(--qm-zoom, 1);
}
/* #endif */

/* #ifdef H5 */
uni-page-body {
  zoom: var(--qm-zoom, 1);
}
/* #endif */

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .btn-primary:active,
  .btn-ghost:active {
    transform: none;
  }
}
</style>
