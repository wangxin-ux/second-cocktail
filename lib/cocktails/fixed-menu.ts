import type { FlavorId } from "@/app/flavors/flavors";
import type { SpiritId } from "@/app/spirits/spirits";
import type { CocktailIngredient, CocktailRecipe } from "./types";

export type FixedMenuRecipe = CocktailRecipe & {
  flavor: FlavorId;
  variantIndex: 1 | 2 | 3;
  liqueurs: string[];
  allergens: string[];
  caffeineFlag: boolean;
  availability: true;
  version: "108-liqueur-menu-v1";
};

type MenuRow = readonly [string, string, string, string, string?];

const liqueurTerms = ["君度", "查特", "St-Germain", "Chambord", "Galliano", "金巴利", "味美思", "Fernet", "樱桃利口酒", "本尼迪克丁", "Midori", "Limoncello", "蓝橙皮利口酒", "咖啡利口酒", "Amaretto", "可可利口酒", "Frangelico", "Amaro", "桃子利口酒", "Maraschino", "Orgeat", "Allspice Dram", "Apricot Brandy", "橙味利口酒", "Triple Sec", "Lillet", "Drambuie", "Peach Schnapps", "白薄荷利口酒", "苦艾酒"];

function ingredientsFromSpec(spec: string): CocktailIngredient[] {
  return spec.split("；").map((part) => {
    const value = part.trim();
    const match = value.match(/^(.*?)(?:\s+(\d+(?:[–-]\d+)?)(?:\s+(dash|叶))?)?$/);
    const name = match?.[1]?.trim() || value;
    const amount = match?.[2];
    const unit = match?.[3];
    if (!amount) return { name };
    if (unit) return { name, amountText: `${amount} ${unit}` };
    if (amount.includes("–") || amount.includes("-")) return { name, amountText: `${amount} ml` };
    return { name, amountMl: Number(amount) };
  });
}

function classify(spec: string) {
  const allergens = [
    ...(spec.includes("蛋白") ? ["蛋类"] : []),
    ...(spec.includes("奶油") || spec.includes("椰浆") ? ["乳制品"] : []),
    ...(spec.includes("杏仁") || spec.includes("Amaretto") || spec.includes("Frangelico") || spec.includes("Orgeat") ? ["坚果"] : []),
  ];
  return {
    liqueurs: liqueurTerms.filter((term) => spec.includes(term)),
    allergens,
    caffeineFlag: /咖啡|浓缩/.test(spec),
  };
}

function makeRecipes(baseSpirit: SpiritId, flavor: FlavorId, rows: readonly MenuRow[]): FixedMenuRecipe[] {
  return rows.map(([name, spec, method, glass, garnish], index) => ({
    id: `108-${baseSpirit}-${flavor}-${index + 1}`,
    name,
    baseSpirit,
    flavor,
    variantIndex: (index + 1) as 1 | 2 | 3,
    ingredients: ingredientsFromSpec(spec),
    method,
    glass,
    garnish,
    source: "108 杯鸡尾酒配方库（利口酒丰富版）",
    ...classify(spec),
    availability: true,
    version: "108-liqueur-menu-v1",
  }));
}

const gin = {
  sour: [["Gin Sour", "金酒 45；君度 15；鲜柠檬汁 25；单糖浆 10；可选蛋白 20", "摇和", "鸡尾酒杯"], ["White Lady", "金酒 40；君度 20；查特绿 5；鲜柠檬汁 20；可选蛋白 15", "摇和", "鸡尾酒杯"], ["Bee's Knees", "金酒 45；St-Germain 接骨木花 10；鲜柠檬汁 20；蜂蜜糖浆 15", "摇和", "鸡尾酒杯"]],
  sweet: [["Clover Club", "金酒 45；Chambord 覆盆子 10；鲜柠檬汁 20；覆盆子糖浆 10；蛋白 20", "干摇后加冰再摇", "鸡尾酒杯"], ["French 75 (Gin)", "金酒 30；St-Germain 10；鲜柠檬汁 15；糖浆 5；起泡酒 60–90", "先摇和前四项，滤入笛形杯后补起泡酒", "笛形杯"], ["Ramos Gin Fizz", "金酒 45；Galliano 5；鲜柠檬汁 15；鲜青柠汁 15；糖浆 15；奶油 20；蛋白 20；橙花水 1 dash；苏打水 30", "长时间干摇后加冰再摇，最后加苏打", "高球杯"]],
  bitter: [["Negroni", "金酒 30；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Martinez", "金酒 45；甜味美思 25；樱桃利口酒 5；本尼迪克丁 5；橙味苦精 1 dash", "加冰搅拌", "鸡尾酒杯", "柠檬皮"], ["Gin & It", "金酒 35；金巴利 10；甜味美思 30；橙味苦精 1 dash", "加冰搅拌", "鸡尾酒杯", "柠檬皮"]],
  fruity: [["Bramble", "金酒 45；黑莓利口酒 15；Chambord 5；鲜柠檬汁 25；单糖浆 10", "摇和", "岩石杯碎冰"], ["Singapore Sling", "金酒 30；樱桃利口酒 15；本尼迪克丁 5；鲜柠檬汁 20；菠萝汁 60；糖浆 10；苏打水 30", "摇和后滤入高球杯补苏打", "高球杯"], ["Southside", "金酒 45；Midori 蜜瓜 10；鲜柠檬汁 25；单糖浆 10；薄荷叶 6–8 叶", "摇和", "鸡尾酒杯或高球杯"]],
  refreshing: [["Tom Collins", "金酒 45；St-Germain 10；鲜柠檬汁 25；单糖浆 10；苏打水 90", "先摇和，再加苏打", "高球杯"], ["Gin Tonic", "金酒 45；St-Germain 10；汤力水 110；青柠角", "加冰直调", "高球杯或球杯"], ["Southside Fizz", "金酒 45；Midori 10；鲜柠檬汁 25；单糖浆 10；薄荷叶 6–8 叶；苏打水 60", "摇和后滤入高球杯补苏打", "高球杯"]],
  bold: [["Dry Martini", "金酒 60；干味美思 10；查特绿 3；橙味苦精 1 dash", "加冰搅拌", "冰镇 Martini 杯", "柠檬皮"], ["Vesper", "金酒 45；伏特加 15；Lillet Blanc 10；柠檬皮", "加冰搅拌", "冰镇 Martini 杯"], ["Gin Old Fashioned", "金酒 55；本尼迪克丁 5；单糖浆 5；安格仕苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"]],
} as const;

const vodka = {
  sour: [["Lemon Drop", "伏特加 45；君度 15；Limoncello 10；鲜柠檬汁 20；单糖浆 5", "摇和", "鸡尾酒杯", "半糖边可选"], ["Kamikaze", "伏特加 40；君度 20；蓝橙皮利口酒 5；鲜青柠汁 20", "摇和", "鸡尾酒杯"], ["Vodka Sour", "伏特加 45；Chambord 10；鲜柠檬汁 25；单糖浆 10；可选蛋白 20", "摇和后浮 Chambord", "鸡尾酒杯或岩石杯"]],
  sweet: [["Espresso Martini", "伏特加 35；咖啡利口酒 20；Amaretto 杏仁 5；浓缩咖啡 30；糖浆 5", "摇和", "鸡尾酒杯"], ["Chocolate Martini", "伏特加 35；可可利口酒 20；Frangelico 榛果 5；奶油 15；巧克力糖浆 5", "摇和", "鸡尾酒杯", "可可粉装饰"], ["Appletini", "伏特加 40；苹果利口酒 15；Midori 蜜瓜 5；青柠汁 10；糖浆 5", "摇和", "鸡尾酒杯"]],
  bitter: [["Black Russian", "伏特加 40；咖啡利口酒 20；Amaro Averna 10", "加冰直调", "岩石杯"], ["White Russian", "伏特加 45；咖啡利口酒 20；Frangelico 5；奶油 20", "加冰直调后浮奶油", "岩石杯"], ["Vodka Negroni", "伏特加 25；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"]],
  fruity: [["Cosmopolitan", "伏特加 40；君度 15；Chambord 5；蔓越莓汁 30；青柠汁 15", "摇和", "鸡尾酒杯"], ["Sex on the Beach", "伏特加 40；桃子利口酒 15；Midori 5；蔓越莓汁 45；橙汁 45", "加冰直调", "高球杯"], ["Cape Codder", "伏特加 45；Chambord 10；蔓越莓汁 80；青柠角", "加冰直调", "高球杯"]],
  refreshing: [["Moscow Mule", "伏特加 45；St-Germain 10；青柠汁 15；姜汁啤酒 110", "加冰直调", "高球杯或铜杯"], ["Vodka Tonic", "伏特加 45；St-Germain 10；汤力水 110；青柠角", "加冰直调", "高球杯"], ["Screwdriver (Harvey Wallbanger 变体)", "伏特加 45；Galliano 10；橙汁 80", "加冰直调后浮 Galliano", "高球杯"]],
  bold: [["Vodka Martini", "伏特加 60；干味美思 10；查特绿 3；橙味苦精 1 dash", "加冰搅拌", "冰镇 Martini 杯", "柠檬皮"], ["Vodka Old Fashioned", "伏特加 55；本尼迪克丁 5；单糖浆 5；安格仕苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Vodka Gimlet", "伏特加 50；君度 10；青柠汁 20；单糖浆 10", "摇和", "冰镇 Martini 杯"]],
} as const;

const rum = {
  sour: [["Daiquiri", "白朗姆 50；君度 10；鲜青柠汁 25；单糖浆 10", "摇和", "鸡尾酒杯"], ["Hemingway Special", "白朗姆 55；樱桃利口酒 10；Maraschino 5；鲜青柠汁 25；葡萄柚汁 15", "摇和", "鸡尾酒杯"], ["X.Y.Z.", "白朗姆 45；君度 15；Orgeat 杏仁糖浆 10；鲜青柠汁 20", "摇和", "鸡尾酒杯"]],
  sweet: [["Piña Colada", "白朗姆 45；Amaretto 5；椰浆 30；菠萝汁 90；青柠汁 10", "与碎冰搅打", "飓风杯"], ["Painkiller", "黑朗姆 55；Frangelico 5；菠萝汁 120；橙汁 30；椰浆 30；肉豆蔻少许", "加冰摇匀", "高球杯或飓风杯"], ["Rum Runner", "黑朗姆 40；香蕉利口酒 15；黑莓利口酒 10；Galliano 5；菠萝汁 60；橙汁 30；石榴糖浆 10", "加冰摇匀", "飓风杯"]],
  bitter: [["Jungle Bird", "黑朗姆 40；金巴利 20；Fernet-Branca 5；菠萝汁 45；青柠汁 15；糖浆 10", "摇和", "岩石杯碎冰"], ["Queen's Park Swizzle", "白朗姆 55；Allspice Dram 多香果 5；鲜青柠汁 25；单糖浆 15；安格仕苦精 3–4 dash；薄荷叶", "杯中 swizzle", "高球杯碎冰"], ["Rum Negroni", "黑朗姆 25；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"]],
  fruity: [["Mai Tai", "陈年朗姆 45；橙味利口酒 10；君度 5；青柠汁 25；杏仁糖浆 15", "摇和", "岩石杯碎冰"], ["Hurricane", "白朗姆 30；黑朗姆 30；Apricot Brandy 杏子 10；鲜青柠汁 25；百香果糖浆 15；橙汁 30", "摇和", "飓风杯"], ["Bacardi Cocktail", "白朗姆 45；Maraschino 5；鲜青柠汁 25；石榴糖浆 15", "摇和", "鸡尾酒杯"]],
  refreshing: [["Mojito", "白朗姆 45；St-Germain 10；青柠汁 15；糖浆 10；薄荷 8–10 叶；苏打水 90", "杯中轻压薄荷后直调", "高球杯"], ["Cuba Libre", "白朗姆 45；Amaretto 5；青柠汁 15；可乐 115", "加冰直调", "高球杯"], ["Dark 'n' Stormy", "黑朗姆 40；Allspice Dram 5；姜汁啤酒 115；青柠角", "加冰直调", "高球杯"]],
  bold: [["El Presidente", "陈年朗姆 40；干味美思 20；橙味利口酒 10；本尼迪克丁 5；石榴糖浆 5", "加冰搅拌", "鸡尾酒杯"], ["Rum Old Fashioned", "黑朗姆 55；本尼迪克丁 5；单糖浆 5；安格仕苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Navy Grog", "白朗姆 30；黑朗姆 25；陈年朗姆 15；Allspice Dram 5；鲜青柠汁 25；葡萄柚汁 15；蜂蜜糖浆 10；单糖浆 5", "摇和", "岩石杯碎冰"]],
} as const;

const tequila = {
  sour: [["Classic Margarita", "Blanco 龙舌兰 45；君度 20；Triple Sec 5；鲜青柠汁 25", "摇和", "岩石杯或鸡尾酒杯", "盐边可选"], ["Tommy's Margarita", "Blanco 龙舌兰 45；St-Germain 10；鲜青柠汁 25；龙舌兰糖浆 10", "摇和", "岩石杯或鸡尾酒杯"], ["Tequila Sour", "Reposado 龙舌兰 45；Chambord 10；鲜柠檬汁 25；单糖浆 10；可选蛋白 20", "摇和后浮 Chambord", "鸡尾酒杯"]],
  sweet: [["Mexican Firing Squad", "Blanco 龙舌兰 45；君度 10；青柠汁 25；石榴糖浆 15；安格仕苦精 2 dash", "摇和", "岩石杯加冰"], ["Cantarito", "Blanco 龙舌兰 45；St-Germain 10；西柚汁 30；橙汁 15；青柠汁 15；青柠苏打 50", "加冰直调", "陶瓷杯或高球杯", "盐边可选"], ["Pineapple Margarita", "Blanco 龙舌兰 40；君度 10；菠萝汁 30；青柠汁 15；单糖浆 10", "摇和", "岩石杯", "盐边可选"]],
  bitter: [["Rosita", "Reposado 龙舌兰 40；金巴利 15；甜味美思 15；干味美思 15；Fernet-Branca 5；苦精 1 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Tequila Negroni", "Reposado 龙舌兰 25；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Mezcal Negroni", "梅斯卡尔 25；金巴利 30；Amaro Nonino 15；甜味美思 10", "加冰搅拌", "岩石杯大冰", "橙皮"]],
  fruity: [["Tequila Sunrise", "Blanco 龙舌兰 40；君度 10；橙汁 90；石榴糖浆 15", "加冰直调", "高球杯"], ["Juan Collins", "Blanco 龙舌兰 45；St-Germain 10；鲜柠檬汁 25；单糖浆 10；苏打水 90", "先摇和后加苏打", "高球杯"], ["Matador", "Blanco 龙舌兰 40；君度 10；菠萝汁 60；青柠汁 15", "摇和", "鸡尾酒杯"]],
  refreshing: [["Paloma", "Blanco 龙舌兰 45；St-Germain 10；鲜青柠汁 15；葡萄柚汽水 110", "加冰直调", "高球杯", "盐边可选"], ["Tequila Soda", "Blanco 龙舌兰 40；君度 10；苏打水 110；青柠角", "加冰直调", "高球杯"], ["Charro Negro", "Blanco 龙舌兰 45；Amaretto 5；青柠汁 15；可乐 95", "加冰直调", "高球杯"]],
  bold: [["Oaxaca Old Fashioned", "Reposado 龙舌兰 40；梅斯卡尔 15；本尼迪克丁 5；龙舌兰糖浆 5；苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Reposado Old Fashioned", "Reposado 龙舌兰 55；本尼迪克丁 5；龙舌兰糖浆 5；安格仕苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Mezcal Old Fashioned", "梅斯卡尔 50；Amaro Averna 10；龙舌兰糖浆 5；安格仕苦精 2 dash；巧克力苦精 1 dash", "加冰搅拌", "岩石杯大冰", "橙皮"]],
} as const;

const whisky = {
  sour: [["Whisky Sour", "波本 40；君度 10；鲜柠檬汁 25；单糖浆 10；可选蛋白 20", "摇和", "岩石杯加冰"], ["Boston Sour", "波本 45；Amaretto 5；鲜柠檬汁 25；单糖浆 10；蛋白 20", "摇和", "岩石杯加冰"], ["Scotch Sour", "调和威士忌 40；Drambuie 10；鲜柠檬汁 25；单糖浆 10", "摇和", "鸡尾酒杯"]],
  sweet: [["Gold Rush", "波本 50；Drambuie 10；鲜柠檬汁 25；蜂蜜糖浆 10", "摇和", "岩石杯加冰"], ["Blood and Sand", "调和威士忌 30；甜味美思 15；樱桃利口酒 10；君度 5；橙汁 15", "摇和", "鸡尾酒杯"], ["Maple Whisky Sour", "波本 45；Amaretto 5；鲜柠檬汁 20；枫糖浆 15", "摇和", "岩石杯加冰"]],
  bitter: [["Boulevardier", "波本 40；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Old Pal", "黑麦 45；金巴利 25；干味美思 25；Amaro Nonino 5", "加冰搅拌", "鸡尾酒杯", "柠檬皮"], ["Rob Roy", "苏格兰威士忌 40；Drambuie 5；甜味美思 30；安格仕苦精 1 dash", "加冰搅拌", "鸡尾酒杯", "樱桃"]],
  fruity: [["New York Sour", "波本 50；Chambord 5；鲜柠檬汁 25；糖浆 10；干红葡萄酒 15", "先摇和后浮红酒 + Chambord", "岩石杯"], ["Whisky Smash", "波本 40；Chambord 10；鲜柠檬汁 20；单糖浆 5；薄荷叶 6–8 叶", "摇和", "岩石杯碎冰"], ["Whisky Daisy", "波本 45；Chambord 5；鲜柠檬汁 20；覆盆子糖浆 15；苏打水 30", "摇和后补苏打", "高球杯"]],
  refreshing: [["Whisky Highball", "调和威士忌 40；Drambuie 10；冰镇苏打水 110；柠檬皮可选", "大量冰直调", "高球杯"], ["John Collins", "波本 45；St-Germain 10；鲜柠檬汁 25；单糖浆 10；苏打水 90", "先摇和后加苏打", "高球杯"], ["Mint Julep", "波本 50；Peach Schnapps 10；单糖浆 10；薄荷叶 8–10 叶", "杯中轻压薄荷后加碎冰搅拌", "银杯或高球杯"]],
  bold: [["Old Fashioned", "波本 55；本尼迪克丁 5；单糖浆 5；苦精 2–3 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Sazerac", "黑麦 60；单糖浆 5；Peychaud 苦精 2 dash；安格仕苦精 1 dash；苦艾酒冲洗杯", "搅拌后滤入苦艾酒冲洗过的冰镇古典杯", "冰镇古典杯", "柠檬皮"], ["Manhattan", "黑麦 40；甜味美思 30；本尼迪克丁 5；安格仕苦精 1 dash", "加冰搅拌", "鸡尾酒杯", "樱桃"]],
} as const;

const brandy = {
  sour: [["Sidecar", "干邑 45；君度 20；Triple Sec 5；鲜柠檬汁 20", "摇和", "鸡尾酒杯", "糖边可选"], ["Brandy Sour", "干邑 40；君度 10；鲜柠檬汁 25；单糖浆 10；可选蛋白 20", "摇和", "鸡尾酒杯"], ["Between the Sheets", "干邑 30；白朗姆 30；君度 15；Chambord 5；鲜青柠汁 20", "摇和", "鸡尾酒杯"]],
  sweet: [["Brandy Alexander", "白兰地 35；深色可可利口酒 20；Frangelico 5；奶油 20", "摇和", "鸡尾酒杯", "肉豆蔻"], ["Stinger", "干邑 35；白薄荷利口酒 20；白可可利口酒 5", "加冰搅拌", "鸡尾酒杯"], ["Brandy Crusta", "干邑 45；君度 10；Maraschino 5；鲜柠檬汁 15；安格仕苦精 1 dash；柠檬皮", "摇和", "糖边鸡尾酒杯"]],
  bitter: [["Brandy Negroni", "白兰地 25；金巴利 30；甜味美思 25；Fernet-Branca 5", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Brandy Manhattan", "干邑 40；甜味美思 30；本尼迪克丁 5；安格仕苦精 1 dash", "加冰搅拌", "鸡尾酒杯", "樱桃"], ["Horse's Neck", "白兰地 40；Amaro Averna 10；姜汁啤酒 110；安格仕苦精 2 dash；柠檬皮螺旋", "加冰直调", "高球杯"]],
  fruity: [["Japanese Cocktail", "干邑 55；君度 5；杏仁糖浆 15；安格仕苦精 2 dash；柠檬皮", "加冰搅拌", "鸡尾酒杯"], ["Jack Rose", "苹果白兰地 40；Apricot Brandy 杏子 10；鲜柠檬汁 20；石榴糖浆 15", "摇和", "鸡尾酒杯"], ["Brandy Daisy", "干邑 45；Chambord 5；鲜柠檬汁 20；覆盆子糖浆 15；苏打水 30", "摇和后补苏打", "高球杯"]],
  refreshing: [["French 75 (Cognac)", "干邑 30；St-Germain 10；鲜柠檬汁 15；糖浆 5；起泡酒 60–90", "先摇和前四项，滤入笛形杯后补起泡酒", "笛形杯"], ["Brandy Highball", "干邑 40；St-Germain 10；苏打水 110；柠檬皮", "加冰直调", "高球杯"], ["Brandy Cobbler", "干邑 40；君度 10；橙片；柠檬片；单糖浆 10；苏打水 60", "杯中轻压水果后加冰与苏打", "高球杯"]],
  bold: [["Vieux Carré", "黑麦 30；干邑 30；甜味美思 30；本尼迪克丁 5；苦精各 1 dash", "加冰搅拌", "岩石杯大冰", "柠檬皮"], ["Brandy Old Fashioned", "干邑 55；本尼迪克丁 5；单糖浆 5；安格仕苦精 2 dash", "加冰搅拌", "岩石杯大冰", "橙皮"], ["Metropolitan", "干邑 40；甜味美思 20；本尼迪克丁 5；单糖浆 5；安格仕苦精 1 dash", "加冰搅拌", "鸡尾酒杯"]],
} as const;

const source: Record<SpiritId, Record<FlavorId, readonly MenuRow[]>> = { gin, vodka, rum, tequila, whisky, brandy };

export const fixedMenuRecipes = (Object.entries(source) as [SpiritId, Record<FlavorId, readonly MenuRow[]>][]).flatMap(([spirit, flavors]) =>
  (Object.entries(flavors) as [FlavorId, readonly MenuRow[]][]).flatMap(([flavor, rows]) => makeRecipes(spirit, flavor, rows)),
);

if (fixedMenuRecipes.length !== 108) {
  throw new Error(`Fixed menu must contain 108 recipes; received ${fixedMenuRecipes.length}.`);
}

export function getMenuVariants(spirit: SpiritId, flavor: FlavorId) {
  return fixedMenuRecipes.filter((recipe) => recipe.baseSpirit === spirit && recipe.flavor === flavor);
}

export function getFixedMenuRecipe(spirit: SpiritId, flavor: FlavorId, variantIndex: number) {
  return getMenuVariants(spirit, flavor).find((recipe) => recipe.variantIndex === variantIndex);
}
