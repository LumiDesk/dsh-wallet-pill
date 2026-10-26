# AGENTS.md

- 本项目为 DeepSeek Harness（DSH）插件：Host 半区 Node + TypeScript，Client 半区 React + TypeScript
- 包管理器：pnpm（12.x，锁定 `pnpm-lock.yaml`）
- 样式方案：DSH 主题 token（`--dsw-*`）+ 注入式 CSS（`src/client/styles.ts`），无预处理器
- UI 组件库：无（官方禁止第三方插件 require `@deepseek-ai/dsh-client-ui-primitives`，控件自己写）

## Project Structure

```
src/
├── host/          # 宿主半边：HTTP 路由、信任栅栏、余额取数、峰谷与价目表
├── client/        # 浏览器半边：槽位注册、胶囊、面板、样式
scripts/           # build-client.mjs（esbuild 打包）、release.mjs（发版）
test/              # node --test 测试与 TS 项目
locale/            # 插件元数据（zh / en）
docs/assets/       # README 截图（深色 / 浅色）
dist/              # 入库的构建产物：GitHub 源安装直接使用
```

## Coding Style

**TypeScript**

- 使用 `interface` 定义 Props 与模块之间的契约
- 组件用函数声明 + 显式 Props 类型（不使用 `React.FC`）
- Never 使用 `any`
- Host 侧只从 `@deepseek-ai/cordis` 取 `Context`；服务接口在本文件内声明最小结构，不为两个方法引入整包类型

**样式**

- 所有样式集中在 `src/client/styles.ts`，以 `<style data-plugin="wallet-pill">` 注入
- Never 使用内联样式；唯一例外是 portal 浮层的定位坐标（`left` / `top` / `visibility`），
  颜色、字号、间距一律回 `styles.ts`
- Never 硬编码颜色值，只能用 `--dsw-*` 主题 token

**导入**

- Host（NodeNext）：相对导入带 `.ts` 扩展名，`rewriteRelativeImportExtensions` 会改写为 `.js`
- Client（Bundler + esbuild）：相对导入不带扩展名
- 不配置路径别名：这是插件包，不是应用，`@/* → src/*` 不适用

## Build Commands

```bash
pnpm install        # 安装依赖
pnpm hooks:install  # 可选：装 husky git hooks
pnpm build          # host（tsc）+ client（esbuild）
pnpm typecheck      # host / client / test 三个 tsconfig 各过一遍
pnpm lint           # eslint
pnpm test           # node --test（会先自动 build）
pnpm format         # prettier --write
pnpm release patch  # 发版：校验 → 升版本 → 打 tag → npm publish
```

Client 产物必须保持 `window.__ModuleLoader__.load({id, factory(require){…}})` 包装：`scripts/build-client.mjs` 负责，改全局名时 banner、footer、`globalName` 三处一起改。

## 为什么 dist/ 入库

本插件同时通过 npm 和 GitHub 源分发：

- npm 发布时 `files` 会把 `dist/` 打进 tarball；
- 1024Store、DSH Hub、DSH-Store 等商店常用 `github:owner/repo` 安装，直接从 Git commit 取文件，不会执行构建；
- pnpm 12 默认拒绝执行 git 依赖的安装期脚本，不能靠 `prepare` 现场 build。

所以 `dist/` 必须入库。否则 GitHub 源安装能装上，但运行时找不到 `dist/index.js` / `dist/client.js`。改 `src/` 后运行 `pnpm build` 并提交 `dist/`；`pnpm release` 的 `version` 脚本会自动 build 并 `git add dist`。

## Never 规则

- Never 手改 `dist/`：它是入库的构建产物，只通过 `pnpm build` 生成；改 `src/` 后重新 build 并提交
- Never 修改 `pnpm-lock.yaml`（只有依赖变更才由 pnpm 重写）
- Never 在组件内使用 `any`
- Never 使用内联样式（portal 定位坐标除外）
- Never 硬编码颜色值
- Never 在渲染路径中执行耗时操作（取数放 effect，不放 render）
- Never 在列表渲染中省略 `key`
- Never 硬编码敏感信息：`DEEPSEEK_API_KEY` 只在 Host 侧使用，永不下发浏览器
- Never 声明 `@deepseek-ai/dsh-*` 的 `peerDependencies`（会被 DSH 安装闸门判为不兼容；类型包放 devDependencies 并写死版本）
- Never 写盘或建配置目录：本插件零落盘、零配置项
- Never 用静态 `export const inject` 取服务（Cordis 会把它当服务名导致静默不激活）；用 `ctx.inject([...])`
- Never 注册 Host 路由时跳过 `connection.requestRejection(req)`
- Never 声明 `prepare` / `install` / `postinstall` 等安装期生命周期脚本：pnpm 12 会拒绝对 git 依赖执行构建脚本，商店生成的 GitHub 安装命令会直接失败；git hooks 用 `pnpm hooks:install` 手动装
- Never 未经用户明确同意把插件安装进任何 DSH profile

## Commit 规范

- 格式：`type(scope): description`
- 类型：feat / fix / docs / style / refactor / test / chore
