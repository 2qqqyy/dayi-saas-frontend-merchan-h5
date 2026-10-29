import { getStorage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/utils/constants";
import { serverUrl } from "@/utils/server";
import { tr } from "@/utils/i18n";

/** 后端允许的扩展名（与 UploadController.ALLOWED_EXT 保持一致） */
const ALLOWED_EXT = ["jpg", "jpeg", "png", "gif", "webp", "svg"];

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function extOf(path: string): string {
  const i = path.lastIndexOf(".");
  return i < 0 ? "" : path.slice(i + 1).toLowerCase();
}

/**
 * 读取所选文件大小（字节）。
 * uni.chooseImage 的 tempFiles 在不同端形态不一：小程序为数组，H5 可能是单个 File，
 * 这里统一归一化后取 size，取不到时返回 0（即不做大小校验，交由后端兜底）。
 */
function readFileSize(tempFiles: unknown): number {
  const first = Array.isArray(tempFiles) ? tempFiles[0] : tempFiles;
  const size = (first as { size?: number } | undefined)?.size;
  return typeof size === "number" && Number.isFinite(size) ? size : 0;
}

/**
 * 统一拼接文件访问地址，仅用于渲染；入库仍存后端返回的相对路径，
 * 否则会把开发机域名固化进数据，换环境即裂图。
 */
export function resolveFileUrl(url: string): string {
  const u = String(url || "");
  if (!u) return "";
  return serverUrl(u);
}

export interface UploadResult {
  url: string;
  size: number;
}

/**
 * 选择本地图片并上传到后端
 * 后端 POST /api/common/upload  (multipart/form-data: file, biz)
 */
export function chooseAndUploadImage(biz = "product"): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      sizeType: ["compressed"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        const path = (res.tempFilePaths && res.tempFilePaths[0]) || "";
        if (!path) {
          reject(new Error("未选择图片"));
          return;
        }
        const ext = extOf(path);
        if (ext && !ALLOWED_EXT.includes(ext)) {
          uni.showToast({ title: `仅支持 ${ALLOWED_EXT.join("/")} 格式`, icon: "none" });
          reject(new Error("不支持的图片格式"));
          return;
        }
        const size = readFileSize(res.tempFiles);
        if (size > MAX_SIZE) {
          uni.showToast({ title: tr("图片不能超过 5MB"), icon: "none" });
          reject(new Error("图片过大"));
          return;
        }
        try {
          const out = await uploadFile(path, biz);
          resolve(out);
        } catch (e) {
          reject(e);
        }
      },
      fail: () => reject(new Error("已取消选择")),
    });
  });
}

/**
 * 上传指定文件路径到后端。
 * 说明：走 uni.uploadFile 而非 axios（axios 实例 baseURL 固定在 /merchant-api，
 * 而上传接口是公共接口 /api/common/upload）。H5 下 /api 前缀由 vite proxy 转发到后端。
 */
export function uploadFile(filePath: string, biz = "product"): Promise<UploadResult> {
  const token = getStorage<string>(STORAGE_KEYS.token, "");
  // 未登录（入驻申请）走专用公共上传口；登录态走受鉴权保护的通用口
  const path = token ? "/api/common/upload" : "/api/common/upload-public";
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: serverUrl(path),
      filePath,
      name: "file",
      formData: { biz },
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success: (res) => {
        let body: any = null;
        try {
          body = JSON.parse(res.data);
        } catch {
          /* 非 JSON 响应 */
        }
        const code = Number(body?.code);
        if ((code === 200 || code === 0) && body?.data?.url) {
          resolve({
            url: String(body.data.url),
            size: Number(body.data.size ?? 0),
          });
          return;
        }
        const msg = body?.msg ?? body?.message ?? `上传失败(${res.statusCode})`;
        uni.showToast({ title: msg, icon: "none" });
        reject(new Error(msg));
      },
      fail: () => {
        uni.showToast({ title: "上传失败，请重试", icon: "none" });
        reject(new Error("上传失败"));
      },
    });
  });
}
