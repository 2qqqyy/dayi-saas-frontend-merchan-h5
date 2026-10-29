/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/**
 * uni-app 构建时会把 process.env.UNI_PLATFORM 静态替换成字符串字面量
 * （见 @dcloudio/uni-cli-shared/dist/env/define.js），所以这里只补类型，
 * 不需要引入 @types/node。与 C 端 src/env.d.ts 同一处理方式。
 */
declare const process: {
  env: { UNI_PLATFORM?: string }
}
