import { reactive } from "vue";
import { publicService, default as request } from "@/utils/request";
import { STORAGE_KEYS } from "@/utils/constants";
import { getStorage } from "@/utils/storage";
import { i18n } from "@/utils/i18n";

/** 偏好变更计数：页面根节点类名靠它同帧刷新，切主题/深色不必等 onShow */
export const prefsVersion = reactive({ v: 0 });

/**
 * 商家端外观偏好：主题、关怀模式、明暗、语言。
 *
 * 颜色令牌在 uni.scss 里全部指向 var(--qm-*)，这里负责决定给这些变量挂哪一组类：
 * H5 把类写到 <html>，小程序把同一组类写到页面根节点（见 composables/useQmClass.ts），
 * 两端共用一份类名，切主题时整套配色一起变。
 */
export interface AppearancePrefs {
  themeCode: string;
  elder: boolean;
  mode: "auto" | "light" | "dark";
  lang: "zh" | "en";
}

export const DEFAULT_PREFS: AppearancePrefs = {
  themeCode: "forest",
  elder: false,
  mode: "light",
  lang: "zh",
};

const KEY = "qm-merchant-appearance";
const THEME_CACHE = "qm-merchant-themes";

export interface ThemeOption {
  code: string;
  name: string;
  description: string;
  primaryColor: string;
  deepColor: string;
  lightColor: string;
  accentColor: string;
  softColor: string;
  tintColor: string;
  isDefault?: number;
}

export function loadPrefs(): AppearancePrefs {
  try {
    const raw = uni.getStorageSync(KEY);
    const p: AppearancePrefs = raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
    p.lang = i18n.lang;
    return p;
  } catch {
    return { ...DEFAULT_PREFS, lang: i18n.lang };
  }
}

export function savePrefs(p: AppearancePrefs) {
  uni.setStorageSync(KEY, JSON.stringify(p));
  prefsVersion.v++;
  applyPrefs(p);
}

export function isDark(p: AppearancePrefs): boolean {
  if (p.mode === "dark") return true;
  if (p.mode === "light") return false;
  try {
    return uni.getSystemInfoSync().theme === "dark";
  } catch {
    return false;
  }
}

/** 主题类名：H5 与小程序共用，页面根节点绑定同一份 */
export function prefsClass(p: AppearancePrefs): string {
  const cls = ["qm-root", `qm-theme-${p.themeCode || "forest"}`];
  if (isDark(p)) cls.push("qm-mode-dark");
  if (p.elder) cls.push("qm-elder");
  return cls.join(" ");
}

export function applyPrefs(p: AppearancePrefs) {
  // #ifdef H5
  const el = document.documentElement;
  el.className = el.className
    .split(/\s+/)
    .filter((c) => c && !c.startsWith("qm-theme-") && c !== "qm-mode-dark" && c !== "qm-elder")
    .join(" ");
  el.classList.add(`qm-theme-${p.themeCode || "forest"}`);
  if (isDark(p)) el.classList.add("qm-mode-dark");
  if (p.elder) el.classList.add("qm-elder");
  el.dataset.qmLang = p.lang;
  el.style.setProperty("--qm-zoom", p.elder ? "1.18" : "1");
  // #endif
}

/**
 * 取当前主题的色值（JS 侧）。
 *
 * 主题色平时走 CSS 变量，但 switch 的 color 属性只吃字面量，所以另开一条 JS 取色路径。
 */
export interface QmPalette {
  primary: string;
  deep: string;
  light: string;
  accent: string;
  soft: string;
}

const BUILTIN: Record<string, QmPalette> = {
  forest: { primary: "#2F5D43", deep: "#1B3A29", light: "#71906A", accent: "#C8DE84", soft: "#F2F6EC" },
  spring: { primary: "#2F6470", deep: "#1B3F49", light: "#6F98A0", accent: "#BFE0D6", soft: "#F1F7F7" },
  clay: { primary: "#8A4D35", deep: "#5A2F1E", light: "#B08468", accent: "#F0C9A8", soft: "#FBF3EC" },
  plum: { primary: "#6B4B63", deep: "#3F2B3B", light: "#94718A", accent: "#E6C9DC", soft: "#F9F2F7" },
  indigo: { primary: "#3C5175", deep: "#202E45", light: "#7589AA", accent: "#C9D6EE", soft: "#F2F5FA" },
  gold: { primary: "#8A6224", deep: "#4E3612", light: "#B79355", accent: "#EFD79B", soft: "#FBF6E8" },
  rose: { primary: "#96566A", deep: "#582F3C", light: "#BE8B9A", accent: "#F0CDD7", soft: "#FBF2F5" },
};

export function paletteOf(p: AppearancePrefs = loadPrefs()): QmPalette {
  const code = p.themeCode || "forest";
  const remote = cachedThemes().find((t) => t.code === code);
  if (remote) {
    return {
      primary: remote.primaryColor,
      deep: remote.deepColor,
      light: remote.lightColor,
      accent: remote.accentColor,
      soft: remote.softColor,
    };
  }
  return BUILTIN[code] || BUILTIN.forest;
}

export function cachedThemes(): ThemeOption[] {
  try {
    const raw = uni.getStorageSync(THEME_CACHE);
    return raw ? (JSON.parse(raw) as ThemeOption[]) : [];
  } catch {
    return [];
  }
}

export function cacheThemes(themes: ThemeOption[]) {
  uni.setStorageSync(THEME_CACHE, JSON.stringify(themes));
}

export async function fetchThemes(): Promise<ThemeOption[]> {
  const res: any = await publicService.get("/common/appearance");
  const list = res?.data?.themes;
  return Array.isArray(list) ? (list as ThemeOption[]) : [];
}

function hasToken(): boolean {
  return !!getStorage<string>(STORAGE_KEYS.token, "");
}

/** 偏好按商户账号存后端；未登录时只保留本机，不去请求以免 401 打断使用 */
export async function fetchRemotePrefs(): Promise<Partial<AppearancePrefs> | null> {
  if (!hasToken()) return null;
  try {
    const res: any = await request.get("/preferences");
    const d = res?.data || {};
    return {
      themeCode: d.themeCode || undefined,
      elder: d.elderMode === true || d.elderMode === 1,
    };
  } catch {
    return null;
  }
}

export async function pushRemotePrefs(p: AppearancePrefs) {
  if (!hasToken()) return;
  try {
    await request.put("/preferences", { themeCode: p.themeCode, elderMode: p.elder });
  } catch {
    /* 未登录或网络异常时只保留本机偏好 */
  }
}
