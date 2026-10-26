# dsh-wallet-pill

DeepSeek Harness 的余额胶囊：在输入框下方显示账户余额，点开查看峰谷价目与切换倒计时。零配置、不落盘。

> **当前状态：脚手架。** 仓库已搭好 TypeScript 工程、构建链、代码检查、提交校验与测试骨架；
> Host 只提供一个 `GET /wallet-pill/status` 探针，Client 只渲染一个静态占位胶囊。功能尚未实现。

## 它最终会是什么

- **胶囊**：`余额 ¥12.34`，取自 `DEEPSEEK_API_KEY` 对应的账户余额；读不到就整条不渲染。
- **面板**：点击展开，显示余额、当前是高峰还是空闲时段、下一个切换时刻的倒计时、以及价目表
  （缓存命中 / 未命中 / 输出 × 峰谷两列），带手动刷新与上次刷新时间。
- **不做**：不记账、不统计逐轮消耗、不写任何文件、没有配置项。

## 开发

```bash
pnpm install        # 安装依赖，并装好 git hooks
pnpm build          # host（tsc）+ client（esbuild）都构建
pnpm typecheck      # host / client / test 三个 tsconfig 各过一遍
pnpm lint           # eslint
pnpm test           # node --test，会先自动 build
pnpm format         # prettier --write
pnpm release patch  # 发版：校验 → 升版本 → 打 tag → npm publish → 推送 → GitHub Release
```

Node 22+（本机 24），pnpm 12。客户端产物是 `dist/client.js`，包在 Harness 的
`window.__ModuleLoader__.load(...)` 工厂里。

## 目录

```
src/host/index.ts        Host 入口：HTTP 路由、信任栅栏、状态探针
src/client/index.tsx     Client 入口：槽位注册、字典、占位胶囊
scripts/build-client.mjs Client 的 IIFE 打包
scripts/release.mjs      发版助手
test/                     node --test 测试与 TS 项目
locale/                  插件元数据（zh / en）
cordis.patch.yml         Bundle patch（插入一行 Host 插件）
icon.svg                 插件图标
```

`dist/` 是构建产物，**不入库**；本地安装前必须先 `pnpm build`。

## 安装（功能完成后再用）

```bash
dsh plugin --profile desktop add dsh-wallet-pill
```

## 许可

MIT。价目表数据来自 DeepSeek 官方定价页。
