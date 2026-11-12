export const GENERATIONS = [
  { id: 1, label: '第一世代', region: '关都', range: [1, 151], short: 'GEN I', color: '#e8564f' },
  { id: 2, label: '第二世代', region: '城都', range: [152, 251], short: 'GEN II', color: '#d8a33a' },
  { id: 3, label: '第三世代', region: '丰缘', range: [252, 386], short: 'GEN III', color: '#3e9b76' },
  { id: 4, label: '第四世代', region: '神奥', range: [387, 493], short: 'GEN IV', color: '#6178ba' },
  { id: 5, label: '第五世代', region: '合众', range: [494, 649], short: 'GEN V', color: '#5d6672' },
  { id: 6, label: '第六世代', region: '卡洛斯', range: [650, 721], short: 'GEN VI', color: '#c05b8c' },
  { id: 7, label: '第七世代', region: '阿罗拉', range: [722, 809], short: 'GEN VII', color: '#4d8fa8' },
  { id: 8, label: '第八世代', region: '伽勒尔', range: [810, 905], short: 'GEN VIII', color: '#a65d68' },
  { id: 9, label: '第九世代', region: '帕底亚', range: [906, 1025], short: 'GEN IX', color: '#98713c' },
];

export const DEX_MIN = 1;
export const DEX_MAX = 1025;

export const GENERATION_MAP = Object.fromEntries(GENERATIONS.map((item) => [item.id, item]));

export function getGenerationByDexNumber(id) {
  return GENERATIONS.find((generation) => id >= generation.range[0] && id <= generation.range[1]) || null;
}

export function getGenerationIds(settings) {
  return GENERATIONS
    .filter((generation) => settings.selectedGenerations.includes(generation.id))
    .flatMap((generation) => {
      const from = Math.max(generation.range[0], settings.rangeMin);
      const to = Math.min(generation.range[1], settings.rangeMax);
      if (from > to) return [];
      return Array.from({ length: to - from + 1 }, (_, index) => from + index);
    });
}
