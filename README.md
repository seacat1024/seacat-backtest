# SeaCat Backtest

海猫复盘软件（SeaCat Backtest）

一个用于 BTC / ETH 合约复盘训练的跨平台桌面工具。

## 核心目标

SeaCat Backtest 不是简单的 K 线回放器，而是一个真正可用的交易训练器：

- 隐藏真实时间轴，避免“知道后续”
- 支持随机历史片段复盘
- 支持逐根推进、自动播放、倍速播放
- 支持模拟开多 / 开空 / 平仓
- 支持盈亏统计
- 支持指标实例系统
- 支持画线工具

## 技术栈

- Tauri 2
- Rust
- React + TypeScript + Vite
- SQLite（后续接入）
- Binance 历史数据（后续接入）

## 计划支持周期

- 1m
- 5m
- 15m
- 30m
- 1h
- 4h
- 1d
- 1W

## 当前方向

### V1.x
- 基础 K 线回放
- 隐藏时间轴
- 模拟交易
- 指标实例系统
- 画线工具

### V2.x
- Binance 真历史数据接入
- 本地 SQLite 缓存
- 5 年历史数据导入
- 训练记录

### V3.x
- 复盘笔记
- 规则引擎
- 违规统计
- 多周期联动

## 本地开发

```bash
npm install
cargo tauri dev