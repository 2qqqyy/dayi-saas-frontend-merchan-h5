import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

export default defineConfig({
  plugins: [uni()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    cors: true,
    // 商家端接口：/merchant-api/** -> 后端 /api/merchant/**
    // 注意：登录为 /merchant-api/login -> /api/merchant/login
    // /api/common/** 是后端公共接口（图片上传 /api/common/upload、占位图），不在 /api/merchant 前缀下；
    // /uploads/** 是上传文件的静态访问路径。两者不代理时会被 dev server 回退成 index.html，
    // 表现为「上传报格式错误、图片永远显示不出来」。
    proxy: {
      "/merchant-api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/merchant-api/, "/api/merchant"),
      },
      "/api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      "/uploads": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
      // 与 C 端同一处理：配图已从 src/static/images 移出（小程序主包限 4M，带图直接 16M 传不上去），
      // 统一由后端提供。只代理 /static/images，不代理整个 /static，
      // 否则包内的 static/icons/** 会被打到后端 404。
      "/static/images": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
      },
    },
  },
});
