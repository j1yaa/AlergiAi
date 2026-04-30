// Maps allergen categories to related ingredients/derivatives.
// Keys and values should be lowercase.
const ALLERGEN_CATEGORY_MAP: Record<string, string[]> = {
    dairy: [
        'milk', 'cheese', 'butter', 'cream', 'yogurt', 'yoghurt', 'ice cream',
        'whey', 'casein', 'lactose', 'ghee', 'curd', 'curds', 'kefir',
        'half and half', 'half-and-half', 'sour cream', 'cream cheese',
        'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar',
        'brie', 'gouda', 'provolone', 'swiss cheese', 'feta', 'béchamel',
        'condensed milk', 'evaporated milk', 'powdered milk', 'milk powder',
        'buttermilk', 'milkfat', 'milk fat', 'milk solids', 'lactalbumin',
        'lactoglobulin', 'galactose', 'paneer', 'heavy cream', 'heavy whipping cream',
        'clotted cream', 'crème fraîche', 'creme fraiche', 'double cream',
        'milk chocolate', 'white chocolate', 'nacho cheese', 'string cheese',
        'american cheese', 'swiss', 'creamer', 'dairy', 'whipped cream',
        'dulce de leche', 'caramel sauce', 'quark',
    ],
    eggs: [
        'egg', 'eggs', 'egg white', 'egg yolk', 'albumin', 'globulin',
        'lysozyme', 'mayonnaise', 'mayo', 'meringue', 'ovalbumin',
        'ovomucin', 'ovomucoid', 'ovovitellin', 'egg lecithin',
        'deviled egg', 'deviled eggs', 'egg salad', 'hard boiled egg',
        'scrambled eggs', 'fried egg', 'poached egg', 'omelette', 'omelet',
        'frittata', 'quiche', 'custard', 'hollandaise',
    ],
    peanuts: [
        'peanut', 'peanuts', 'peanut butter', 'peanut oil', 'groundnut',
        'groundnuts', 'arachis oil', 'monkey nuts', 'satay sauce', 'satay',
        'boiled peanuts',
    ],
    'tree nuts': [
        'almond', 'almonds', 'cashew', 'cashews', 'walnut', 'walnuts',
        'pecan', 'pecans', 'pistachio', 'pistachios', 'macadamia',
        'hazelnut', 'hazelnuts', 'brazil nut', 'brazil nuts',
        'pine nut', 'pine nuts', 'chestnut', 'chestnuts', 'praline',
        'marzipan', 'nougat', 'gianduja', 'nutella',
        'almond flour', 'almond butter', 'cashew butter', 'mixed nuts',
        'walnut oil', 'pecan pie', 'marcona almond',
    ],
    shellfish: [
        'shrimp', 'crab', 'lobster', 'crayfish', 'crawfish', 'prawn',
        'prawns', 'scallop', 'scallops', 'clam', 'clams', 'mussel',
        'mussels', 'oyster', 'oysters', 'squid', 'calamari', 'octopus',
        'snail', 'escargot', 'abalone', 'langoustine', 'langoustines',
        'snow crab', 'king crab', 'dungeness crab', 'stone crab',
        'blue crab', 'krill', 'barnacle',
        'cuttlefish', 'whelk', 'conch', 'cockle', 'cockles',
        'geoduck', 'razor clam', 'razor clams',
    ],
    fish: [
        'salmon', 'tuna', 'cod', 'bass', 'sea bass', 'striped bass',
        'trout', 'rainbow trout', 'halibut', 'haddock', 'catfish', 'tilapia',
        'sardine', 'sardines', 'anchovy', 'anchovies', 'herring', 'mackerel',
        'swordfish', 'mahi', 'mahi-mahi', 'fish sauce', 'fish oil',
        'fish gelatin', 'surimi', 'snapper', 'red snapper', 'flounder',
        'sole', 'grouper', 'perch', 'pike', 'carp', 'pollock', 'barramundi',
        'branzino', 'ahi', 'yellowfin', 'bluefin', 'albacore', 'rockfish',
        'whitefish', 'basa', 'pangasius', 'plaice', 'turbot', 'monkfish',
        'raw fish', 'smoked salmon', 'lox', 'gravlax',
    ],
    wheat: [
        'wheat', 'flour', 'bread', 'pasta', 'noodle', 'noodles', 'couscous',
        'bulgur', 'semolina', 'spelt', 'kamut', 'durum', 'einkorn',
        'farina', 'breadcrumbs', 'crouton', 'croutons', 'seitan',
        'wheat starch', 'wheat germ', 'wheat bran',
        'pizza', 'pizza dough', 'pizza crust', 'bagel', 'flour tortilla', 'wheat tortilla',
        'pita', 'pita bread', 'croissant', 'pretzel', 'cracker', 'roll',
        'bun', 'biscuit', 'panko', 'matzo', 'challah', 'focaccia',
        'sourdough', 'pie crust', 'pastry', 'dumpling', 'wrap',
        'udon', 'ramen', 'soba', 'lo mein', 'chow mein',
    ],
    gluten: [
        'wheat', 'barley', 'rye', 'oat', 'oats', 'spelt', 'kamut',
        'triticale', 'semolina', 'durum', 'farina', 'flour', 'bread',
        'pasta', 'noodle', 'noodles', 'couscous', 'bulgur', 'seitan',
        'malt', 'brewer yeast', 'pizza', 'bagel', 'croissant',
        'pretzel', 'cracker', 'roll', 'bun',
    ],
    soy: [
        'soy', 'soybean', 'soybeans', 'soya', 'edamame', 'tofu',
        'tempeh', 'miso', 'soy sauce', 'soy milk', 'soy lecithin',
        'soy protein', 'soy flour', 'soybean oil', 'natto', 'yuba',
        'okara', 'tamari', 'teriyaki sauce',
    ],
    sesame: [
        'sesame', 'sesame seed', 'sesame seeds', 'sesame oil', 'tahini',
        'hummus', 'halvah', 'halva', 'gochujang', 'sesame paste',
    ],
    mustard: [
        'mustard', 'mustard seed', 'mustard seeds', 'mustard oil',
        'mustard powder', 'mustard flour', 'dijon', 'whole grain mustard',
        'yellow mustard', 'hot dog mustard',
    ],
    celery: [
        'celery', 'celeriac', 'celery salt', 'celery seed', 'celery seeds',
    ],
    lupin: [
        'lupin', 'lupine', 'lupini', 'lupini beans',
    ],
    mollusk: [
        'snail', 'escargot', 'clam', 'clams', 'mussel', 'mussels',
        'oyster', 'oysters', 'squid', 'calamari', 'octopus', 'abalone',
        'cuttlefish', 'whelk', 'conch',
    ],
    banana: [
        'banana', 'bananas', 'plantain', 'plantains',
    ],
    mango: [
        'mango', 'mangoes', 'mangos', 'dried mango', 'mango juice',
    ],
};

/**
 * Expands a user allergen into all related terms using the category map.
 * For example, "Dairy" -> ["dairy", "milk", "cheese", "butter", ...].
 * If no category match is found, returns the allergen itself.
 */
export const expandAllergen = (allergen: string): string[] => {
    const normalized = allergen.toLowerCase().trim();
    const terms = new Set<string>([normalized]);

    // Check if this allergen is a category key
    if (ALLERGEN_CATEGORY_MAP[normalized]) {
        ALLERGEN_CATEGORY_MAP[normalized].forEach(t => terms.add(t));
    }

    // Check if this allergen appears in any category's values
    for (const [category, relatedTerms] of Object.entries(ALLERGEN_CATEGORY_MAP)) {
        if (relatedTerms.includes(normalized)) {
            terms.add(category);
            relatedTerms.forEach(t => terms.add(t));
        }
    }

    return Array.from(terms);
};

export const matchIngredientsWallergens = (
    detectedIngredients: string[],
    userAllergens: string[],
    aiAllergenCategories?: string[]
): { matches: string[]; safe: string[] } => {
    const normalText = (text: string): string =>
        text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

    // Expand all user allergens to include related terms
    const expandedTerms = new Set<string>();
    userAllergens.forEach(allergen => {
        expandAllergen(allergen).forEach(term => expandedTerms.add(normalText(term)));
    });

    // If AI provided allergen categories, find which user allergens were matched
    // by the AI and expand those categories into additional search terms
    if (aiAllergenCategories && aiAllergenCategories.length > 0) {
        const normalizedUserAllergens = userAllergens.map(a => normalText(a));
        aiAllergenCategories.forEach(cat => {
            const normalCat = normalText(cat);
            // Check if any user allergen matches this AI category
            const isRelevant = normalizedUserAllergens.some(ua =>
                normalCat.includes(ua) || ua.includes(normalCat)
            );
            if (isRelevant) {
                // Expand the AI category to get all related terms
                expandAllergen(cat).forEach(term => expandedTerms.add(normalText(term)));
            }
        });
    }

    const matches = detectedIngredients.filter(ingredient => {
        const normalIngredient = normalText(ingredient);

        return Array.from(expandedTerms).some(term =>
            normalIngredient === term ||
            normalIngredient.includes(term) ||
            term.startsWith(normalIngredient)
        );
    });

    const safe = detectedIngredients.filter(ingredient => !matches.includes(ingredient));

    return { matches, safe };
};