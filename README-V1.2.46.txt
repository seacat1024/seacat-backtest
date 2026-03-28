SeaCat Backtest V1.2.46

这次是基于你刚上传的 Git 版本直接改的，不是旧补丁包。

修复：
- 指标中心里 RSI / MACD / KDJ / BOLL 左侧勾选框现在用原生 checkbox
- 不再使用外层 button + 内层点击的嵌套结构
- 修掉了 draft 被点击行重置的问题
- 应用时会规范化 selectedIds 再保存

改动文件：
- src/components/indicators/IndicatorCenterModal.tsx
- src/styles/global.css
- package.json / src-tauri/Cargo.toml / src-tauri/tauri.conf.json
