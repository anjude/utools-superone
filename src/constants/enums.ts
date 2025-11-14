// 统一枚举定义文件
// 所有业务枚举在此文件中定义，确保类型一致性和统一管理

// 通用枚举
export namespace CommonEnums {
  // 热门数据平台
  export enum HotDataPlatform {
    ZhiHu = 1,    // 知乎
    WeiBo = 2,    // 微博
    BaiDu = 3,    // 百度
    XueQiu = 4    // 雪球
  }
}

// 计划相关枚举
export namespace ScheduleEnums {
  // 季度枚举
  export enum Quarter {
    Annual = 0,  // 年度
    Q1 = 1,      // 第一季度
    Q2 = 2,      // 第二季度
    Q3 = 3,      // 第三季度
    Q4 = 4       // 第四季度
  }
  // 计划状态枚举
  export enum ScheduleStatus {
    Draft = 0,        // 草稿
    Active = 1,       // 进行中
    Paused = 2,       // 暂停
    Completed = 3,    // 已完成
    Cancelled = 4     // 已取消
  }

  // 计划类型枚举
  export enum ScheduleType {
    Daily = 1,        // 每日计划
    Weekly = 2,       // 每周计划
    Monthly = 3,      // 每月计划
    Custom = 4        // 自定义计划
  }

  // 奖励类型枚举
  export enum RewardType {
    Points = 1,       // 积分
    Badge = 2,        // 徽章
    Coupon = 3,       // 优惠券
    Gift = 4          // 实物礼品
  }

  // 签到状态枚举
  export enum CheckinStatus {
    Missed = 0,       // 未签到
    Checked = 1,      // 已签到
    Late = 2          // 迟到签到
  }
}

// 流程相关枚举
export namespace FlowEnums {
  // 信息类型枚举
  export enum InfoType {
    RichText = 1,    // 富文本
    Image = 2        // 图片
  }

  // 排序方式枚举
  export enum SortBy {
    CreateTime = 1,  // 按创建时间
    Hot = 2          // 按热度
  }

  // 点赞操作枚举
  export enum LikeAction {
    Like = 1,        // 点赞
    Unlike = 2       // 取消点赞
  }

  // 验证类型枚举
  export enum FlowVerifyType {
    Unverified = 0,      // 未验证
    UserVerify = 1,      // 用户验证
    OfficialVerify = 2   // 官方验证
  }
}

// 用户相关枚举
export namespace UserEnums {
  // 登录类型
  export enum LoginType {
    MpCode = 1,      // 小程序码登录
    MpQrCode = 2     // 小程序二维码登录
  }

  // 验证类型
  export enum VerifyType {
    Unverified = 0,      // 未验证
    UserVerify = 1,      // 用户验证
    OfficialVerify = 2   // 官方验证
  }

  // 订阅消息类型
  export enum SubscribeMsgType {
    WeeklyCheckin = 1,   // 周签到
    ItemRemind = 2       // 物品提醒
  }

  // 用户权限枚举
  export enum UserPermission {
    AdFree = 1  // 免广告权限（位0，值为1）
  }
}


// 清单相关枚举
export namespace ChecklistEnums {
  // 执行模式枚举
  export enum ExecutionMode {
    Overview = 1,  // 执行
    Step = 2       // 分步执行
  }

  // 执行状态枚举
  export enum ExecutionStatus {
    InProgress = 1,  // 进行中
    Completed = 2    // 已完成
  }

  // 清单分类枚举
  export enum ChecklistCategory {
    Work = 1,        // 工作
    Life = 2,        // 生活
    Health = 3,     // 健康
    Study = 4,       // 学习
    Travel = 5,      // 旅行
    Other = 6        // 其他
  }
}

// 物品管理相关枚举
export namespace ItemManagementEnums {
  // 物品状态枚举
  export enum ItemStatus {
    InUse = 1,           // 使用中
    Stored = 2,          // 闲置
    Broken = 3,          // 损坏
    Lost = 4,            // 丢失
    Sold = 5,            // 已出售
    GivenAway = 6,       // 已赠送
    Recycled = 7         // 已回收
  }

  // 物品分类枚举
  export enum ItemCategory {
    All = 0,             // 全部
    Electronics = 1,     // 电子产品
    Clothing = 2,        // 服装
    Books = 3,           // 图书
    Home = 4,            // 家居用品
    Sports = 5,          // 运动用品
    Beauty = 6,          // 美妆护肤
    Food = 7,            // 食品
    Tools = 8,           // 工具
    Other = 9            // 其他
  }
}

// 标的管理相关枚举
export namespace StockEnums {
  // 标的类型枚举
  export enum StockType {
    Stock = 1,           // 股票
    Fund = 2,            // 基金
    Bond = 3,            // 债券
    ETF = 4,             // ETF
    Other = 5            // 其他
  }
}

// 主题相关枚举
export namespace TopicEnums {
  // 主题类型枚举
  export enum TopicType {
    Topic = 1,      // 原主题
    Stock = 2,      // 标的思考
    Item = 3,       // 物品日志
    Feedback = 4    // 用户反馈
  }

  // 主题日志标记位枚举
  export enum TopicLogMark {
    Normal = 1  // 普通标记（1 << 0）
  }
}

// 导出所有枚举的联合类型，便于类型检查
export type AllEnums = 
  | CommonEnums.HotDataPlatform
  | ScheduleEnums.Quarter
  | ScheduleEnums.ScheduleStatus
  | ScheduleEnums.ScheduleType
  | ScheduleEnums.RewardType
  | ScheduleEnums.CheckinStatus
  | FlowEnums.InfoType
  | FlowEnums.SortBy
  | FlowEnums.LikeAction
  | FlowEnums.FlowVerifyType
  | UserEnums.LoginType
  | UserEnums.VerifyType
  | UserEnums.SubscribeMsgType
  | UserEnums.UserPermission
  | ChecklistEnums.ExecutionMode
  | ChecklistEnums.ExecutionStatus
  | ChecklistEnums.ChecklistCategory
  | ItemManagementEnums.ItemStatus
  | ItemManagementEnums.ItemCategory
  | StockEnums.StockType
  | TopicEnums.TopicType
  | TopicEnums.TopicLogMark;
