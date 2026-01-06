# Gemini 记忆

本文件用于记录项目相关信息，以便 Gemini 提供更精准的帮助。

## 技术栈

- **后端:** .NET Core, Entity Framework Core, SQLite
- **前端:** Next.js (React), Material-UI (MUI), Axios

## 架构

- **后端:** 采用分层设计，包含 Controller, Service, 和 Entity 层。
- **前端:** 基于组件的架构，支持多种可切换的抽奖主题界面。

## 数据模型

- **Activities (活动表):** Id, Name, Description, ThemeType, Status, CreatedAt
- **Prizes (奖品表):** Id, ActivityId, Name, Level, Quantity, RemainingQuantity, ImageUrl
- **Participants (参与者表):** Id, ActivityId, Name, Code, Department, IsWinner
- **WinnerRecords (中奖记录表):** Id, ActivityId, ParticipantId, PrizeId, WonAt, Round

## API 接口

- `GET/POST /api/activities` - 活动管理
- `GET/POST /api/activities/{id}/prizes` - 奖品管理
- `GET/POST /api/activities/{id}/participants` - 参与者管理
- `POST /api/lottery/draw` - 执行抽奖
- `GET /api/lottery/winners/{activityId}` - 获取中奖记录
- `POST /api/lottery/reset/{activityId}` - 重置抽奖

## 前端页面设计

- **管理后台:** 活动管理、奖品管理、参与者管理（支持批量导入）
- **抽奖界面:** 支持多种创意主题
  - 经典转盘 (Wheel)
  - 3D球体动画 (Sphere)
  - 可扩展添加更多主题

## 项目功能

1. **多活动管理** - 支持创建多个抽奖活动
2. **奖品设置** - 支持多等级奖品配置
3. **参与者管理** - 支持批量导入参与者
4. **多主题抽奖界面** - 支持切换不同的创意抽奖动画
5. **中奖记录** - 保存并查询所有中奖记录
6. **抽奖重置** - 支持重置活动重新抽奖

## 备注
- **编码需要添加中文注释**
- **数据库使用 SQLite 方便本地调试**
