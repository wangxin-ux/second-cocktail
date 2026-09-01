import type { Language } from "@/lib/i18n";
import type { CocktailRecipe } from "./types";

const ingredientNames: Record<string, string> = {
  "Allspice Dram 多香果": "Allspice Dram",
  "Amaretto 杏仁": "Amaretto",
  "Apricot Brandy 杏子": "Apricot Brandy",
  "Blanco 龙舌兰": "Blanco Tequila",
  "Chambord 覆盆子": "Chambord",
  "Frangelico 榛果": "Frangelico",
  "Midori 蜜瓜": "Midori",
  "Orgeat 杏仁糖浆": "Orgeat",
  "Peychaud 苦精": "Peychaud's Bitters",
  "Reposado 龙舌兰": "Reposado Tequila",
  "St-Germain 接骨木花": "St-Germain",
  伏特加: "Vodka",
  冰镇苏打水: "Chilled Soda Water",
  单糖浆: "Simple Syrup",
  可乐: "Cola",
  可可利口酒: "Crème de Cacao",
  可选蛋白: "Egg White (optional)",
  君度: "Cointreau",
  咖啡利口酒: "Coffee Liqueur",
  奶油: "Cream",
  姜汁啤酒: "Ginger Beer",
  安格仕苦精: "Angostura Bitters",
  巧克力糖浆: "Chocolate Syrup",
  巧克力苦精: "Chocolate Bitters",
  干味美思: "Dry Vermouth",
  干红葡萄酒: "Dry Red Wine",
  干邑: "Cognac",
  本尼迪克丁: "Bénédictine",
  杏仁糖浆: "Orgeat",
  枫糖浆: "Maple Syrup",
  柠檬片: "Lemon Slice",
  柠檬皮: "Lemon Peel",
  柠檬皮可选: "Lemon Peel (optional)",
  柠檬皮螺旋: "Lemon Twist",
  查特绿: "Green Chartreuse",
  桃子利口酒: "Peach Liqueur",
  梅斯卡尔: "Mezcal",
  椰浆: "Coconut Cream",
  樱桃利口酒: "Cherry Liqueur",
  橙味利口酒: "Orange Liqueur",
  橙味苦精: "Orange Bitters",
  橙汁: "Orange Juice",
  橙片: "Orange Slice",
  橙花水: "Orange Blossom Water",
  汤力水: "Tonic Water",
  波本: "Bourbon",
  浓缩咖啡: "Espresso",
  深色可可利口酒: "Dark Crème de Cacao",
  甜味美思: "Sweet Vermouth",
  白兰地: "Brandy",
  白可可利口酒: "White Crème de Cacao",
  白朗姆: "White Rum",
  白薄荷利口酒: "White Crème de Menthe",
  百香果糖浆: "Passion Fruit Syrup",
  石榴糖浆: "Grenadine",
  糖浆: "Syrup",
  肉豆蔻少许: "Pinch of Nutmeg",
  苏打水: "Soda Water",
  苏格兰威士忌: "Scotch Whisky",
  苦精: "Bitters",
  苦精各: "Bitters (each)",
  苦艾酒冲洗杯: "Absinthe Rinse",
  苹果利口酒: "Apple Liqueur",
  苹果白兰地: "Apple Brandy",
  菠萝汁: "Pineapple Juice",
  葡萄柚汁: "Grapefruit Juice",
  葡萄柚汽水: "Grapefruit Soda",
  蓝橙皮利口酒: "Blue Curaçao",
  蔓越莓汁: "Cranberry Juice",
  薄荷: "Mint",
  薄荷叶: "Mint Leaves",
  蛋白: "Egg White",
  蜂蜜糖浆: "Honey Syrup",
  西柚汁: "Grapefruit Juice",
  覆盆子糖浆: "Raspberry Syrup",
  调和威士忌: "Blended Whisky",
  起泡酒: "Sparkling Wine",
  金巴利: "Campari",
  金酒: "Gin",
  陈年朗姆: "Aged Rum",
  青柠汁: "Lime Juice",
  青柠苏打: "Lime Soda",
  青柠角: "Lime Wedge",
  香蕉利口酒: "Banana Liqueur",
  鲜柠檬汁: "Fresh Lemon Juice",
  鲜青柠汁: "Fresh Lime Juice",
  黑朗姆: "Dark Rum",
  黑莓利口酒: "Blackberry Liqueur",
  黑麦: "Rye Whiskey",
  龙舌兰糖浆: "Agave Syrup",
};

const methods: Record<string, string> = {
  与碎冰搅打: "Blend with crushed ice.",
  "先摇和前四项，滤入笛形杯后补起泡酒": "Shake the first four ingredients with ice, strain into a flute, then top with sparkling wine.",
  先摇和后加苏打: "Shake with ice, strain, then add soda water.",
  "先摇和后浮红酒 + Chambord": "Shake with ice, strain, then float the red wine and Chambord.",
  "先摇和，再加苏打": "Shake with ice, strain, then add soda water.",
  加冰搅拌: "Stir with ice.",
  加冰摇匀: "Shake with ice.",
  加冰直调: "Build over ice and stir briefly.",
  "加冰直调后浮 Galliano": "Build over ice, stir briefly, then float Galliano.",
  加冰直调后浮奶油: "Build over ice, stir briefly, then float the cream.",
  大量冰直调: "Build over plenty of ice and stir briefly.",
  干摇后加冰再摇: "Dry shake, then shake again with ice.",
  搅拌后滤入苦艾酒冲洗过的冰镇古典杯: "Stir with ice, then strain into a chilled, absinthe-rinsed rocks glass.",
  摇和: "Shake with ice.",
  "摇和后浮 Chambord": "Shake with ice, strain, then float Chambord.",
  摇和后滤入高球杯补苏打: "Shake with ice, strain into a highball glass, then top with soda water.",
  摇和后补苏打: "Shake with ice, strain, then top with soda water.",
  "杯中 swizzle": "Swizzle in the glass with crushed ice.",
  杯中轻压水果后加冰与苏打: "Gently muddle the fruit in the glass, then add ice and soda water.",
  杯中轻压薄荷后加碎冰搅拌: "Gently muddle the mint in the glass, add crushed ice, then stir.",
  杯中轻压薄荷后直调: "Gently muddle the mint in the glass, then build over ice.",
  "长时间干摇后加冰再摇，最后加苏打": "Dry shake thoroughly, shake again with ice, then finish with soda water.",
};

const glasses: Record<string, string> = {
  "冰镇 Martini 杯": "Chilled Martini Glass",
  冰镇古典杯: "Chilled Rocks Glass",
  岩石杯: "Rocks Glass",
  岩石杯加冰: "Rocks Glass over Ice",
  岩石杯大冰: "Rocks Glass with a Large Ice Cube",
  岩石杯或鸡尾酒杯: "Rocks or Cocktail Glass",
  岩石杯碎冰: "Rocks Glass with Crushed Ice",
  笛形杯: "Flute",
  糖边鸡尾酒杯: "Sugar-rimmed Cocktail Glass",
  银杯或高球杯: "Silver Cup or Highball Glass",
  陶瓷杯或高球杯: "Clay Cup or Highball Glass",
  飓风杯: "Hurricane Glass",
  高球杯: "Highball Glass",
  高球杯或球杯: "Highball or Balloon Glass",
  高球杯或铜杯: "Highball Glass or Copper Mug",
  高球杯或飓风杯: "Highball or Hurricane Glass",
  高球杯碎冰: "Highball Glass with Crushed Ice",
  鸡尾酒杯: "Cocktail Glass",
  鸡尾酒杯或岩石杯: "Cocktail or Rocks Glass",
  鸡尾酒杯或高球杯: "Cocktail or Highball Glass",
};

const garnishes: Record<string, string> = {
  半糖边可选: "Half Sugar Rim (optional)",
  可可粉装饰: "Cocoa Powder",
  柠檬皮: "Lemon Peel",
  樱桃: "Cherry",
  橙皮: "Orange Peel",
  盐边可选: "Salt Rim (optional)",
  糖边可选: "Sugar Rim (optional)",
  肉豆蔻: "Nutmeg",
};

const labels: Record<string, string> = {
  君度: "Cointreau",
  查特: "Chartreuse",
  金巴利: "Campari",
  味美思: "Vermouth",
  樱桃利口酒: "Cherry Liqueur",
  本尼迪克丁: "Bénédictine",
  蓝橙皮利口酒: "Blue Curaçao",
  咖啡利口酒: "Coffee Liqueur",
  可可利口酒: "Crème de Cacao",
  桃子利口酒: "Peach Liqueur",
  橙味利口酒: "Orange Liqueur",
  白薄荷利口酒: "White Crème de Menthe",
  苦艾酒: "Absinthe",
  蛋类: "Egg",
  乳制品: "Dairy",
  坚果: "Tree Nuts",
};

const chineseIngredientNames: Record<string, string> = {
  "Allspice Dram 多香果": "多香果利口酒",
  "Allspice Dram": "多香果利口酒",
  "Amaretto 杏仁": "杏仁利口酒",
  Amaretto: "杏仁利口酒",
  "Amaro Averna": "阿维纳苦酒",
  "Amaro Nonino": "诺尼诺苦酒",
  Amaro: "意式苦酒",
  "Apricot Brandy 杏子": "杏子白兰地",
  "Apricot Brandy": "杏子白兰地",
  "Blanco 龙舌兰": "银龙舌兰",
  "Blanco Tequila": "银龙舌兰",
  "Chambord 覆盆子": "覆盆子利口酒",
  Chambord: "覆盆子利口酒",
  "Fernet-Branca": "费尔奈布兰卡苦酒",
  Fernet: "费尔奈苦酒",
  "Frangelico 榛果": "榛果利口酒",
  Frangelico: "榛果利口酒",
  Galliano: "加利安奴利口酒",
  "Lillet Blanc": "白利莱酒",
  Lillet: "利莱酒",
  Limoncello: "柠檬利口酒",
  "Maraschino Liqueur": "樱桃利口酒",
  Maraschino: "樱桃利口酒",
  "Midori 蜜瓜": "蜜瓜利口酒",
  Midori: "蜜瓜利口酒",
  "Orgeat 杏仁糖浆": "杏仁糖浆",
  Orgeat: "杏仁糖浆",
  "Peach Schnapps": "桃子利口酒",
  "Peychaud 苦精": "佩乔苦精",
  "Peychaud's Bitters": "佩乔苦精",
  "Reposado 龙舌兰": "陈酿龙舌兰",
  "Reposado Tequila": "陈酿龙舌兰",
  "St-Germain 接骨木花": "接骨木花利口酒",
  "St-Germain": "接骨木花利口酒",
  "Triple Sec": "橙味利口酒",
  Gin: "金酒",
  Vodka: "伏特加",
  Rum: "朗姆酒",
  Whisky: "威士忌",
  Whiskey: "威士忌",
  Tequila: "龙舌兰",
  Brandy: "白兰地",
  "Lemon Juice": "柠檬汁",
  "Lime Juice": "青柠汁",
  "Grapefruit Juice": "葡萄柚汁",
  "Simple Syrup": "单糖浆",
  "Honey Syrup": "蜂蜜糖浆",
  "Agave Syrup": "龙舌兰糖浆",
  "Demerara Syrup": "黄糖糖浆",
  "Pineapple Juice": "菠萝汁",
  "Passion Fruit Puree": "百香果果泥",
  "Orange Juice": "橙汁",
  "Cranberry Juice": "蔓越莓汁",
  "Peach Puree": "桃子果泥",
  "Raspberry Puree": "覆盆子果泥",
  "Elderflower Liqueur": "接骨木花利口酒",
  "Orange Liqueur": "橙味利口酒",
  "Coffee Liqueur": "咖啡利口酒",
  "Angostura Bitters": "安格仕苦精",
  "Orange Bitters": "橙味苦精",
  Basil: "罗勒",
  Mint: "薄荷",
  Rosemary: "迷迭香",
  Cucumber: "黄瓜",
  "Soda Water": "苏打水",
  "Chilled Soda Water": "冰镇苏打水",
  "Tonic Water": "汤力水",
  "Ginger Beer": "姜汁啤酒",
  Campari: "金巴利",
  Aperol: "阿佩罗",
  "Sweet Vermouth": "甜味美思",
  "Dry Vermouth": "干味美思",
};

const chineseGlasses: Record<string, string> = Object.fromEntries(
  Object.entries(glasses).map(([chinese, english]) => [english, chinese.replaceAll("Martini", "马天尼")]),
);

const chineseGarnishes: Record<string, string> = {
  ...Object.fromEntries(Object.entries(garnishes).map(([chinese, english]) => [english, chinese])),
  "Lemon twist": "柠檬皮螺旋",
  "Lime wheel": "青柠片",
  "Orange twist": "橙皮螺旋",
  "Grated nutmeg": "肉豆蔻碎",
  "Grapefruit peel": "葡萄柚皮",
  "Orange wheel": "橙片",
  "Fresh raspberry": "新鲜覆盆子",
  "Mint sprig": "薄荷枝",
  "Cucumber ribbon": "黄瓜薄片",
  "Grapefruit twist": "葡萄柚皮螺旋",
};

const chineseLabels: Record<string, string> = Object.fromEntries(
  Object.entries(labels).map(([chinese, english]) => [english, chinese]),
);

const hasHan = (value: string) => /\p{Script=Han}/u.test(value);

function translated(value: string | undefined, dictionary: Record<string, string>, fallback: string) {
  if (!value) return value;
  const exact = dictionary[value];
  if (exact) return exact;

  let result = value;
  for (const [source, target] of Object.entries({ ...glasses, ...ingredientNames, ...dictionary }).sort(([a], [b]) => b.length - a.length)) {
    result = result.replaceAll(source, target);
  }
  return hasHan(result) ? fallback : result;
}

function translatedToChinese(value: string | undefined, dictionary: Record<string, string>, fallback: string) {
  if (!value) return value;
  const exact = dictionary[value];
  if (exact) return exact;

  let result = value;
  for (const [source, target] of Object.entries({ ...chineseIngredientNames, ...dictionary }).sort(([a], [b]) => b.length - a.length)) {
    result = result.replaceAll(source, target);
  }
  result = result
    .replace(/\bml\b/gi, "毫升")
    .replace(/\bdashes?\b/gi, "滴")
    .replace(/\bleaves?\b/gi, "片")
    .replace(/\bsmall sprig\b/gi, "小枝")
    .replace(/\bthin slices?\b/gi, "薄片")
    .replace(/\bswizzle\b/gi, "旋转搅拌")
    .trim();
  return /[A-Za-z]/.test(result.replaceAll("second", "")) ? fallback : result;
}

/** Localizes all user-visible recipe fields while preserving the canonical recipe data. */
export function localizeCocktailRecipe(recipe: CocktailRecipe, language: Language): CocktailRecipe {
  if (language === "zh") {
    return {
      ...recipe,
      // Cocktail names are proper names and stay canonical in every language.
      name: recipe.name,
      ingredients: recipe.ingredients.map((ingredient) => ({
        ...ingredient,
        name: translatedToChinese(ingredient.name, chineseIngredientNames, "调酒原料")!,
        ...(ingredient.amountText
          ? { amountText: translatedToChinese(ingredient.amountText, {}, "适量") }
          : {}),
      })),
      method: translatedToChinese(recipe.method, {}, "按调酒师标准方法调制。")!,
      ...(recipe.glass ? { glass: translatedToChinese(recipe.glass, chineseGlasses, "鸡尾酒杯") } : {}),
      ...(recipe.garnish ? { garnish: translatedToChinese(recipe.garnish, chineseGarnishes, "调酒师选择") } : {}),
      ...(recipe.liqueurs ? { liqueurs: recipe.liqueurs.map((item) => translatedToChinese(item, chineseLabels, "利口酒")!) } : {}),
      ...(recipe.allergens ? { allergens: recipe.allergens.map((item) => translatedToChinese(item, chineseLabels, "过敏原")!) } : {}),
      ...(recipe.source ? { source: translatedToChinese(recipe.source, {}, "second 配方") } : {}),
    };
  }

  return {
    ...recipe,
    name: translated(recipe.name, { 变体: "variation" }, "Cocktail")!,
    ingredients: recipe.ingredients.map((ingredient) => ({
      ...ingredient,
      name: translated(ingredient.name, ingredientNames, "Ingredient")!,
      ...(ingredient.amountText
        ? { amountText: translated(ingredient.amountText, { 叶: "leaves" }, "To taste") }
        : {}),
    })),
    method: translated(recipe.method, methods, "Follow the bartender's standard preparation method.")!,
    ...(recipe.glass ? { glass: translated(recipe.glass, glasses, "Cocktail Glass") } : {}),
    ...(recipe.garnish ? { garnish: translated(recipe.garnish, garnishes, "Bartender's Choice") } : {}),
    ...(recipe.liqueurs ? { liqueurs: recipe.liqueurs.map((item) => translated(item, labels, "Liqueur")!) } : {}),
    ...(recipe.allergens ? { allergens: recipe.allergens.map((item) => translated(item, labels, "Allergen")!) } : {}),
    ...(recipe.source ? { source: translated(recipe.source, {}, "Second fixed menu") } : {}),
  };
}

export function recipeContainsHan(recipe: CocktailRecipe) {
  return [
    recipe.name,
    recipe.method,
    recipe.glass,
    recipe.garnish,
    recipe.source,
    ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.amountText]),
    ...(recipe.liqueurs ?? []),
    ...(recipe.allergens ?? []),
  ].some((value) => value && hasHan(value));
}
