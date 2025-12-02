/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { AIGoal, BuildingType, CityStats, Grid, NewsItem } from "../types";
import { BUILDINGS } from "../constants";

// 本地化模拟 AI 服务
// 这一层将根据游戏状态生成伪随机的目标和新闻，替代之前的 Gemini API 调用

const GOAL_TEMPLATES = [
  { type: 'population', multiplier: 1.2, base: 20, desc: "城市在扩张！我们需要吸引更多居民。" },
  { type: 'money', multiplier: 1.5, base: 500, desc: "国库空虚，我们需要增加税收收入。" },
  { type: 'building_count', building: BuildingType.Park, add: 2, desc: "市民们抱怨缺乏绿化，多建几个公园吧。" },
  { type: 'building_count', building: BuildingType.Commercial, add: 3, desc: "商业区拥挤不堪，是时候扩张商业版图了。" },
  { type: 'building_count', building: BuildingType.Industrial, add: 2, desc: "为了提高就业率，我们需要更多的工厂。" },
  { type: 'building_count', building: BuildingType.Residential, add: 5, desc: "住房短缺危机！快建造更多住宅。" },
];

const NEWS_TEMPLATES = [
  { text: "一位市民在公园里发现了一只罕见的蝴蝶。", type: 'positive' },
  { text: "最近的交通状况有所改善。", type: 'positive' },
  { text: "新的商业区吸引了大量游客。", type: 'positive' },
  { text: "有市民抱怨工厂噪音太大了。", type: 'negative' },
  { text: "房价正在飞涨，年轻人买不起房。", type: 'negative' },
  { text: "气象局发布了大风预警。", type: 'neutral' },
  { text: "一年一度的城市庆典即将开始。", type: 'positive' },
  { text: "有传言说市长计划建设新的地标。", type: 'neutral' },
  { text: "街道清洁度评级上升了。", type: 'positive' },
  { text: "一些老旧建筑需要修缮。", type: 'negative' },
];

export const generateCityGoal = async (stats: CityStats, grid: Grid): Promise<AIGoal | null> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  const counts: Record<string, number> = {};
  grid.flat().forEach(tile => {
    counts[tile.buildingType] = (counts[tile.buildingType] || 0) + 1;
  });

  // 随机选择一个目标模板
  const template = GOAL_TEMPLATES[Math.floor(Math.random() * GOAL_TEMPLATES.length)];
  
  let targetValue = 0;
  let reward = 0;
  let description = "";

  if (template.type === 'population') {
    targetValue = Math.floor(Math.max(stats.population * template.multiplier!, stats.population + template.base!));
    reward = Math.floor(targetValue * 2);
    description = template.desc;
  } else if (template.type === 'money') {
    targetValue = Math.floor(stats.money + template.base!);
    reward = Math.floor(template.base! * 0.5);
    description = template.desc;
  } else if (template.type === 'building_count' && template.building) {
    const currentCount = counts[template.building] || 0;
    targetValue = currentCount + template.add!;
    reward = template.add! * BUILDINGS[template.building].cost * 0.8;
    description = template.desc;
  }

  return {
    description,
    targetType: template.type as any,
    targetValue,
    buildingType: template.building,
    reward,
    completed: false
  };
};

export const generateNewsEvent = async (stats: CityStats, recentAction: string | null): Promise<NewsItem | null> => {
  // 简单的随机新闻
  const template = NEWS_TEMPLATES[Math.floor(Math.random() * NEWS_TEMPLATES.length)];
  
  // 根据状态微调概率（可选）
  if (stats.money < 100 && Math.random() > 0.5) {
    return {
      id: Date.now().toString(),
      text: "财政赤字严重，城市濒临破产！",
      type: 'negative'
    };
  }

  return {
    id: Date.now().toString() + Math.random(),
    text: template.text,
    type: template.type as any,
  };
};