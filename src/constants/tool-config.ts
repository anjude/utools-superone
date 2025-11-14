// 工具配置类型定义
export interface ToolConfig {
  key: string;
  name: string;
  icon: string;
  color: string;
  textColor: string;
  url: string;
  status: "ready" | "developing";
}


// 工具配置数据
export const toolConfig: ToolConfig[] = [
  {
    key: "plan",
    name: "做任务",
    icon: "cuIcon-list",
    color: "bg-green",
    textColor: "text-green",
    url: "/pages/plan/index",
    status: "ready",
  },
  {
    key: "report",
    name: "财报提醒",
    icon: "cuIcon-notification",
    color: "bg-blue",
    textColor: "text-blue",
    url: "", // 开发中
    status: "developing",
  },
  {
    key: "analysis",
    name: "数据分析",
    icon: "cuIcon-appreciate",
    color: "bg-purple",
    textColor: "text-purple",
    url: "", // 开发中
    status: "developing",
  },
  {
    key: "portfolio",
    name: "投资组合",
    icon: "cuIcon-profile",
    color: "bg-cyan",
    textColor: "text-cyan",
    url: "", // 开发中
    status: "developing",
  },
  {
    key: "news",
    name: "市场资讯",
    icon: "cuIcon-discover",
    color: "bg-red",
    textColor: "text-red",
    url: "", // 开发中
    status: "developing",
  },
  {
    key: "risk",
    name: "风险评估",
    icon: "cuIcon-warn",
    color: "bg-yellow",
    textColor: "text-yellow",
    url: "", // 开发中
    status: "developing",
  },
  {
    key: "itemManagement",
    name: "物品管理",
    icon: "cuIcon-goods",
    color: "bg-red",
    textColor: "text-red",
    url: "/pages/item-management/index",
    status: "ready",
  },
  {
    key: "stockManagement",
    name: "投资思考",
    icon: "cuIcon-edit",
    color: "bg-green",
    textColor: "text-green",
    url: "/pages/stock-management/index",
    status: "ready",
  },
  {
    key: "topicManagement",
    name: "主题管理",
    icon: "cuIcon-form",
    color: "bg-cyan",
    textColor: "text-cyan",
    url: "/pages/topic-management/index",
    status: "ready",
  },
  {
    key: "more",
    name: "更多工具",
    icon: "cuIcon-more",
    color: "bg-gray",
    textColor: "text-gray",
    url: "", // 开发中
    status: "developing",
  },
];
