export default {
  root: "./dist/build/h5",
  build: { outDir: "." },
  preview: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    cors: true,
    proxy: {
      "/merchant-api": {
        target: "http://127.0.0.1:8081",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/merchant-api/, "/api/merchant"),
      },
      "/api": { target: "http://127.0.0.1:8081", changeOrigin: true },
      "/uploads": { target: "http://127.0.0.1:8081", changeOrigin: true },
      "/static/images": { target: "http://127.0.0.1:8081", changeOrigin: true },
    },
  },
};
