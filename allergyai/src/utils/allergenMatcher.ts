export const matchIngredientsWallergens = (
    detectedIngredients: string[],
    userAllergens: string[]
): { matches: string[]; safe: string[] } => {
    const normalText = (text: string): string =>
        text.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');

    const matches = detectedIngredients.filter(ingredient => {
        const normalIngredient = normalText(ingredient);

        return userAllergens.some(allergen => {
            const normalAllergen = normalText(allergen);

            return (
                normalIngredient.includes(normalAllergen) ||
                normalAllergen.includes(normalIngredient)
            );
        });
    });

    const safe = detectedIngredients.filter(ingredient => !matches.includes(ingredient));

    return { matches, safe };
};