<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { onShow } from "@dcloudio/uni-app";
import { setLang, tr } from "@/utils/i18n";
import {
  DEFAULT_PREFS,
  applyPrefs,
  cachedThemes,
  fetchRemotePrefs,
  fetchThemes,
  cacheThemes,
  loadPrefs,
  prefsClass,
  pushRemotePrefs,
  savePrefs,
  type AppearancePrefs,
  type ThemeOption,
} from "@/utils/appearance";
import { useQmClass } from "@/composables/useQmClass";
import { useQmPalette } from "@/composables/useQmPalette";
import MerchantNavbar from "@/components/MerchantNavbar.vue";

/** 主题 / 关怀模式类名：小程序没有 DOM，必须挂在页面根节点上 */
const qmClass = useQmClass();
const palette = useQmPalette();

const prefs = ref<AppearancePrefs>(loadPrefs());

/** 后台主题表取不到时用同一套内置配色兜底，保证选择器不会空着 */
const FALLBACK: ThemeOption[] = [
  { code: "forest", name: "青梅绿", description: "", primaryColor: "#2F5D43", deepColor: "#1B3A29", lightColor: "#71906A", accentColor: "#C8DE84", softColor: "#F2F6EC", tintColor: "#E9EFE1" },
  { code: "spring", name: "山泉青", description: "", primaryColor: "#2F6470", deepColor: "#1B3F49", lightColor: "#6F98A0", accentColor: "#BFE0D6", softColor: "#F1F7F7", tintColor: "#E4EFF0" },
  { code: "clay", name: "暖陶土", description: "", primaryColor: "#8A4D35", deepColor: "#5A2F1E", lightColor: "#B08468", accentColor: "#F0C9A8", softColor: "#FBF3EC", tintColor: "#F4E7DC" },
  { code: "plum", name: "暮山紫", description: "", primaryColor: "#6B4B63", deepColor: "#3F2B3B", lightColor: "#94718A", accentColor: "#E6C9DC", softColor: "#F9F2F7", tintColor: "#F1E4ED" },
  { code: "indigo", name: "夜靛蓝", description: "", primaryColor: "#3C5175", deepColor: "#202E45", lightColor: "#7589AA", accentColor: "#C9D6EE", softColor: "#F2F5FA", tintColor: "#E5EBF5" },
  { code: "gold", name: "稻田金", description: "", primaryColor: "#8A6224", deepColor: "#4E3612", lightColor: "#B79355", accentColor: "#EFD79B", softColor: "#FBF6E8", tintColor: "#F4EACD" },
  { code: "rose", name: "山茶粉", description: "", primaryColor: "#96566A", deepColor: "#582F3C", lightColor: "#BE8B9A", accentColor: "#F0CDD7", softColor: "#FBF2F5", tintColor: "#F4E3E8" },
];

const themes = ref<ThemeOption[]>(cachedThemes().length ? cachedThemes() : FALLBACK);

const MODES: { v: AppearancePrefs["mode"]; label: string }[] = [
  { v: "light", label: "浅色" },
  { v: "dark", label: "深色" },
  { v: "auto", label: "跟随系统" },
];

const LANGS: { v: "zh" | "en"; label: string }[] = [
  { v: "zh", label: "中文" },
  { v: "en", label: "English" },
];

const previewClass = computed(() => prefsClass(prefs.value));

function themeName(code: string) {
  const t = themes.value.find((x) => x.code === code);
  if (!t) return code;
  return prefs.value.lang === "en" ? code.charAt(0).toUpperCase() + code.slice(1) : t.name;
}

function commit(next: Partial<AppearancePrefs>) {
  prefs.value = { ...prefs.value, ...next };
  savePrefs(prefs.value);
  pushRemotePrefs(prefs.value);
}

function reset() {
  const next: AppearancePrefs = { ...DEFAULT_PREFS, lang: prefs.value.lang };
  prefs.value = next;
  savePrefs(next);
  pushRemotePrefs(next);
  uni.showToast({ title: tr("已恢复默认外观"), icon: "none" });
}

function onElder(e: Event) {
  const value = (e as unknown as { detail: { value: boolean } }).detail.value;
  commit({ elder: value });
}

onMounted(async () => {
  try {
    const list = await fetchThemes();
    if (list.length) {
      themes.value = list;
      cacheThemes(list);
      applyPrefs(prefs.value);
    }
  } catch {
    /* 主题接口异常时继续用本地缓存或内置配色 */
  }
  const remote = await fetchRemotePrefs();
  if (remote && (remote.themeCode || typeof remote.elder === "boolean")) {
    commit({
      themeCode: remote.themeCode || prefs.value.themeCode,
      elder: typeof remote.elder === "boolean" ? remote.elder : prefs.value.elder,
    });
  }
});

onShow(() => {
  prefs.value = loadPrefs();
});
</script>

<template>
  <view class="dp" :class="qmClass">
    <MerchantNavbar :title="tr('外观')" show-back show-home />

    <view class="dp__body">
      <!-- 预览：切主题时这一块先给反馈 -->
      <view class="dp__preview card" :class="previewClass">
        <text class="dp__preview-title">{{ tr("工作台预览") }}</text>
        <view class="dp__preview-row">
          <text class="dp__preview-label">{{ tr("今日营业额") }}</text>
          <text class="dp__preview-value">¥ 1,286</text>
        </view>
        <view class="dp__preview-chips">
          <text class="dp__chip dp__chip--solid">{{ tr("待核销") }} 6</text>
          <text class="dp__chip">{{ tr("退款") }} 1</text>
        </view>
      </view>

      <!-- 关怀模式 -->
      <view class="dp__section">
        <text class="dp__h">{{ tr("关怀模式") }}</text>
        <view class="dp__card card">
          <view class="dp__row">
            <view class="dp__row-text">
              <text class="dp__label">{{ tr("大字与高对比") }}</text>
              <text class="dp__desc">{{ tr("整页放大、字重加深，方便长辈或远距离查看") }}</text>
            </view>
            <switch :checked="prefs.elder" :color="palette.primary" @change="onElder" />
          </view>
        </view>
      </view>

      <!-- 主题 -->
      <view class="dp__section">
        <text class="dp__h">{{ tr("主题颜色") }}</text>
        <view class="dp__card card">
          <view class="dp__themes">
            <view
              v-for="t in themes"
              :key="t.code"
              class="dp__theme"
              :class="{ 'dp__theme--on': prefs.themeCode === t.code }"
              @tap="commit({ themeCode: t.code })"
            >
              <view class="dp__swatch" :style="{ background: `linear-gradient(140deg, ${t.accentColor}, ${t.primaryColor})` }">
                <text v-if="prefs.themeCode === t.code" class="dp__swatch-check">✓</text>
              </view>
              <text class="dp__theme-name">{{ themeName(t.code) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 明暗 -->
      <view class="dp__section">
        <text class="dp__h">{{ tr("明暗模式") }}</text>
        <view class="dp__card card">
          <view class="dp__seg">
            <view
              v-for="m in MODES"
              :key="m.v"
              class="dp__seg-item"
              :class="{ 'dp__seg-item--on': prefs.mode === m.v }"
              @tap="commit({ mode: m.v })"
            >
              <text>{{ tr(m.label) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 语言 -->
      <view class="dp__section">
        <text class="dp__h">{{ tr("语言") }}</text>
        <view class="dp__card card">
          <view class="dp__seg">
            <view
              v-for="l in LANGS"
              :key="l.v"
              class="dp__seg-item"
              :class="{ 'dp__seg-item--on': prefs.lang === l.v }"
              @tap="setLang(l.v)"
            >
              <text>{{ l.label }}</text>
            </view>
          </view>
          <text class="dp__note">{{ tr("切换语言会重新加载页面") }}</text>
        </view>
      </view>

      <view class="dp__reset" @tap="reset">
        <text>{{ tr("恢复默认外观") }}</text>
      </view>

      <text class="dp__tip">{{ tr("主题与关怀模式按商户账号保存，换设备登录后会自动带回") }}</text>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.dp__body {
  padding: 12rpx 24rpx 60rpx;
  display: flex;
  flex-direction: column;
  gap: 28rpx;
}

.dp__preview {
  padding: 28rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  background: linear-gradient(150deg, var(--qm-soft, $green-soft) 0%, var(--qm-paper, $paper) 70%);
  border: 1rpx solid var(--qm-line-2, $line-2);
}

.dp__preview-title {
  font-size: 24rpx;
  color: var(--qm-text-sub, $text-sub);
}

.dp__preview-row {
  display: flex;
  align-items: baseline;
  gap: 14rpx;
}

.dp__preview-label {
  font-size: 24rpx;
  color: var(--qm-text-mute, $text-mute);
}

.dp__preview-value {
  font-family: $font-serif;
  font-size: 52rpx;
  font-weight: 700;
  color: var(--qm-primary, $green);
}

.dp__preview-chips {
  display: flex;
  gap: 12rpx;
}

.dp__chip {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  color: var(--qm-primary, $green);
  background: var(--qm-soft, $green-bg);
}

.dp__chip--solid {
  background: var(--qm-primary, $green);
  color: #fff;
}

.dp__section {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.dp__h {
  font-size: 25rpx;
  color: var(--qm-text-sub, $text-sub);
  padding-left: 8rpx;
}

.dp__card {
  padding: 22rpx 24rpx;
}

.dp__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
}

.dp__row-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.dp__label {
  font-size: 28rpx;
  color: var(--qm-text-main, $text-main);
  font-weight: 600;
}

.dp__desc {
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--qm-text-mute, $text-mute);
}

.dp__themes {
  display: flex;
  flex-wrap: wrap;
  gap: 22rpx 18rpx;
}

.dp__theme {
  width: calc((100% - 36rpx) / 3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.dp__swatch {
  width: 100%;
  height: 84rpx;
  border-radius: $radius-md;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid transparent;
}

.dp__theme--on .dp__swatch {
  border-color: var(--qm-primary, $green);
  box-shadow: 0 10rpx 26rpx -14rpx var(--qm-primary, $green);
}

.dp__swatch-check {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}

.dp__theme-name {
  font-size: 22rpx;
  color: var(--qm-text-sub, $text-sub);
}

.dp__theme--on .dp__theme-name {
  color: var(--qm-primary, $green);
  font-weight: 600;
}

.dp__seg {
  display: flex;
  gap: 8rpx;
  padding: 6rpx;
  border-radius: $radius-md;
  background: var(--qm-soft-2, $green-soft);
}

.dp__seg-item {
  flex: 1;
  text-align: center;
  padding: 16rpx 0;
  border-radius: $radius-sm;
  font-size: 25rpx;
  color: var(--qm-text-sub, $text-sub);
}

.dp__seg-item--on {
  background: var(--qm-paper, $paper);
  color: var(--qm-primary, $green);
  font-weight: 600;
  box-shadow: $shadow-card;
}

/* 深色下主色绿压在深底上对比不够，选中项改用亮色字 + 抬高底 */
.qm-mode-dark .dp__seg-item--on {
  background: rgba(255, 255, 255, 0.1);
  color: var(--qm-accent, $lime);
}

.dp__note {
  display: block;
  margin-top: 14rpx;
  font-size: 22rpx;
  color: var(--qm-text-mute, $text-mute);
}

.dp__reset {
  height: 88rpx;
  border-radius: $radius-lg;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--qm-glass-1, $glass-1);
  border: 1rpx solid var(--qm-glass-edge, $glass-edge);
  color: var(--qm-primary, $green);
  font-size: 27rpx;
  font-weight: 600;
}

.dp__tip {
  font-size: 22rpx;
  line-height: 1.7;
  color: var(--qm-text-mute, $text-mute);
  padding: 0 8rpx;
}
</style>
