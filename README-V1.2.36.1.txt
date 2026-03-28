SeaCat Backtest V1.2.36.1

修复：
- 修正 IndicatorSubcharts 返回 JSX 语法错误
- 原因：return (...) 中直接放了条件表达式，缺少 Fragment 包裹
- 现在改成 return (<> ... </>)

本次改动文件：
- src/pages/Training.tsx
  - 大约 310 行附近：IndicatorSubcharts 的 return 语句
