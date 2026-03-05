const allergenMap: Record<string, string> = {
  // dairy
  milk: 'leche',
  dairy: 'lácteos',
  lactose: 'lactosa',
  cheese: 'queso',
  butter: 'mantequilla',
  cream: 'crema',
  yogurt: 'yogur',
  // eggs
  egg: 'huevo',
  eggs: 'huevos',
  // nuts
  nut: 'nuez',
  nuts: 'nueces',
  peanut: 'cacahuete',
  peanuts: 'cacahuetes',
  almond: 'almendra',
  almonds: 'almendras',
  walnut: 'nuez',
  walnuts: 'nueces',
  cashew: 'anacardo',
  cashews: 'anacardos',
  pistachio: 'pistacho',
  pistachios: 'pistachos',
  hazelnut: 'avellana',
  hazelnuts: 'avellanas',
  // seafood
  shellfish: 'mariscos',
  shrimp: 'camarón',
  lobster: 'langosta',
  crab: 'cangrejo',
  fish: 'pescado',
  salmon: 'salmón',
  tuna: 'atún',
  cod: 'bacalao',
  // grains
  wheat: 'trigo',
  gluten: 'gluten',
  flour: 'harina',
  bread: 'pan',
  pasta: 'pasta',
  // soy
  soy: 'soja',
  soya: 'soja',
  tofu: 'tofu',
  // fruits
  banana: 'plátano',
  strawberry: 'fresa',
  strawberries: 'fresas',
  apple: 'manzana',
  peach: 'melocotón',
  kiwi: 'kiwi',
  mango: 'mango',
  // other
  sesame: 'sésamo',
  mustard: 'mostaza',
  celery: 'apio',
  lupin: 'altramuz',
  sulphite: 'sulfito',
  sulphites: 'sulfitos',
  sulfite: 'sulfito',
  sulfites: 'sulfitos',
};

export function translateAllergen(name: string, language: string): string {
  if (language !== 'es') return name;
  const lower = name.toLowerCase();
  return allergenMap[lower] ?? name;
}
