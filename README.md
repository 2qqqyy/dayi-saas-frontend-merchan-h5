# 青梅里 · 商家端 H5（frontend-merchant）

青梅里乡村文旅 SaaS 平台的 **商家端**，面向入驻商户：商品与民宿管理、订单接单与核销、营业状态维护、经营数据查看。

## 技术栈

| 项目 | 说明 |
| --- | --- |
| 框架 | uni-app + Vue 3（`<script setup>` + TypeScript） |
| 构建 | Vite |
| 状态管理 | Pinia |
| 网络 | axios（统一封装在 `src/api/`） |
| 目标端 | H5（可编译微信小程序端） |

## 目录结构

```
.
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src
    ├── api/           # 接口封装（14 个模块）
    ├── components/    # 通用组件（21 个）
    ├── composables/   # 组合式函数（4 个）
    ├── pages/         # 页面（33 个）
    ├── stores/        # Pinia 状态（5 个 store）
    ├── types/         # TypeScript 类型定义
    ├── utils/         # 请求封装、工具函数（12 个）
    ├── static/        # 静态资源
    ├── pages.json     # uni-app 页面路由配置
    ├── manifest.json  # uni-app 应用配置
    ├── uni.scss       # 全局样式变量
    ├── App.vue
    └── main.ts
```

## 本地运行

```bash
npm install
npm run dev:h5          # 开发（H5）
npm run build:h5        # 生产构建
npm run dev:mp-weixin   # 微信小程序端调试
npm run type-check      # 类型检查
```

开发环境通过 Vite 代理把 `/api` 转发到后端 **http://localhost:8081**。

## 后端

对应后端仓库：[dayi-saas-backed-admin](https://github.com/2qqqyy/dayi-saas-backed-admin)（Spring Boot 3，默认端口 8081）。

## 相关仓库

- 用户端 H5 商城：[dayi-saas-frontend-user](https://github.com/2qqqyy/dayi-saas-frontend-user)
- 管理后台 PC：[dayi-saas-frontend-admin](https://github.com/2qqqyy/dayi-saas-frontend-admin)
