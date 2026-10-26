# dsh-wallet-pill

[![npm version](https://img.shields.io/npm/v/dsh-wallet-pill.svg)](https://www.npmjs.com/package/dsh-wallet-pill)
[![npm downloads](https://img.shields.io/npm/dm/dsh-wallet-pill.svg)](https://www.npmjs.com/package/dsh-wallet-pill)
[![license](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/badges/license.svg)](LICENSE)
[![node](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/badges/node.svg)](https://nodejs.org)
[![TypeScript](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/badges/typescript.svg)](https://www.typescriptlang.org)
[![DSH](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/badges/dsh.svg)](https://github.com/deepseek-ai/deepseek-harness)
[![stars](https://img.shields.io/github/stars/LumiDesk/dsh-wallet-pill.svg)](https://github.com/LumiDesk/dsh-wallet-pill/stargazers)

DeepSeek Harness 的余额胶囊：在输入框下方显示账户余额，点开查看峰谷价目与切换倒计时。零配置、不落盘。

> 非官方社区插件，与 DeepSeek 官方无隶属关系。

## 预览

| 深色主题                                                                                                                      | 浅色主题                                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| ![深色主题下的余额胶囊与价目面板](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/panel-dark.png) | ![浅色主题下的余额胶囊与价目面板](https://raw.githubusercontent.com/LumiDesk/dsh-wallet-pill/main/docs/assets/panel-light.png) |

胶囊在输入框下方，与官方的「缓存命中 / 轮次」统计条同排；点开是价目面板。

## 它做什么

**胶囊**（输入框下方，官方统计行之后）

- `余额 ¥12.34` —— 取 `DEEPSEEK_API_KEY` 对应账户的钱包余额；读不到时显示 `余额 —` 并带一个状态点。
- 没配置 key 时整条不渲染，不占位置。
- 点击展开面板，`aria-haspopup="dialog"`，Esc 或点击外部关闭，焦点回到胶囊。

**面板**

| 区块     | 内容                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| 余额     | 总额、充值余额、赠送余额；读取失败时给出可读原因                             |
| 计费时段 | 当前是高峰还是空闲、下一切换时刻的实时倒计时                                 |
| 价目     | 缓存命中 / 未命中 / 输出三档，空闲价与高峰价两列，当前时段高亮；多模型可切换 |
| 底部     | 上次读数时间、价目表版本、手动刷新按钮                                       |

每 60 秒自动刷新一次（页面不可见时暂停），回到页面时立即刷新。

## 数据与口径

- **余额**：Host 侧用 `DEEPSEEK_API_KEY` 调 `GET https://api.deepseek.com/user/balance`，60 秒缓存。密钥只在 Host 进程内使用，浏览器只访问本机路由 `/wallet-pill/state`，响应里只有聚合后的金额。
- **峰谷**：北京时间周一至周五 09:00–12:00、14:00–18:00 为高峰，其余时段（含周末、法定节假日全天）为空闲；高峰价是空闲价的 2 倍。
- **价目**（CNY / 百万 token）：`deepseek-flash` 0.02 / 1 / 4，`deepseek-v4-pro` 0.15 / 4.5 / 13.5（空闲价；高峰加倍）。来源为 DeepSeek 官方定价页，版本 `2026-09-19`。

官方调价或公布次年放假安排时，改 `src/host/pricing.ts` 里的 `MODELS` / `HOLIDAYS` 与 `PRICE_TABLE_VERSION`，面板上显示的版本号会跟着变。

## 安装

```bash
dsh plugin --profile desktop add dsh-wallet-pill
```

装好后需要重启 Harness 进程（Host 侧改动不是刷新页面就能生效），再刷新页面。

卸载：

```bash
dsh plugin --profile desktop remove dsh-wallet-pill
```

## 开发

```bash
pnpm install        # 安装依赖，并装好 git hooks
pnpm build          # host（tsc）+ client（esbuild）
pnpm typecheck      # host / client / test 三个 tsconfig 各过一遍
pnpm lint           # eslint
pnpm test           # node --test，会先自动 build
pnpm format         # prettier --write
pnpm release patch  # 发版：校验 → 升版本 → 打 tag → npm publish
```

Node 22+（本机 24），pnpm 12。客户端产物是 `dist/client.js`，包在 Harness 的 `window.__ModuleLoader__.load(...)` 工厂里；`react` 与 `react-dom` 从页面模块表取，不打包。

## 技术栈

| 层     | 选择                                                                                                                         |
| ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 语言   | TypeScript（`strict`、`noUncheckedIndexedAccess`），全仓无 `any`                                                             |
| Host   | Node 22+ ESM，`tsc` 编译到 `dist/index.js`，运行时零依赖                                                                     |
| Client | React 18（宿主页面模块表提供，不打包）+ esbuild 打成 `__ModuleLoader__` 工厂                                                 |
| 样式   | 只用宿主 `--dsw-*` 主题 token，无 CSS 框架；浮层复用官方 menu surface（`--dsw-specific-menu` + `--dsw-elevation-prominent`） |
| 测试   | `node --test` 直接跑 `.ts`（Node 24 类型剥离），39 条用例，零测试框架                                                        |
| 规范   | ESLint + Prettier + Commitlint（Conventional Commits）+ Husky + lint-staged                                                  |
| 兼容   | DeepSeek Harness ≥ `0.2.1-rc.3`；**不声明** `@deepseek-ai/dsh-*` 的 peer 依赖（否则会被安装闸门拒绝）                        |

## 目录

```
src/host/index.ts        Host 入口：HTTP 路由、信任栅栏、状态装配
src/host/balance.ts      余额取数、缓存、错误映射
src/host/pricing.ts      价目表、峰谷判定、节假日
src/client/index.tsx     Client 入口：槽位注册、字典、样式注入
src/client/pill.tsx      胶囊与面板
src/client/api.ts        状态请求
src/client/format.ts     金额 / 时长 / 时间格式化
src/client/locales.ts    zh / en 文案
scripts/build-client.mjs Client 的 IIFE 打包
scripts/release.mjs      发版助手
test/                     node --test 测试与 TS 项目
locale/                  插件元数据（zh / en）
docs/assets/             README 截图（深色 / 浅色）与自托管徽章
cordis.patch.yml         Bundle patch（插入一行 Host 插件）
```

`dist/` 是构建产物，**不入库**；本地安装前必须先 `pnpm build`。

## 边界

- 只读余额与价目：**不记账、不统计逐轮消耗、不写任何文件、没有配置项**。
- 只支持 `DEEPSEEK_API_KEY`（在模型设置页填写）：账号登录态不属于本插件的范围。
- 价目表是静态数据，官方调价必须改代码发版；面板显示版本号，方便判断读到的是哪一版。
- 无遥测，不向任何第三方发起请求；唯一的出站请求是读取你自己的余额。

## 许可

MIT。价目表与峰谷规则来自 DeepSeek 官方定价页。
