import { z } from "zod";

export const NutrimentSchema = z.object({
	name: z.string().nullable(),
	value: z.number().nullable(),
	"100g": z.number().nullable(),
	serving: z.number().nullable(),
	unit: z.string().nullable(),
	prepared_value: z.number().nullable(),
	prepared_100g: z.number().nullable(),
	prepared_serving: z.number().nullable(),
	prepared_unit: z.string().nullable(),
});

export const FoodProductSchema = z.object({
	additives_n: z.number().nullable(),
	additives_tags: z.array(z.string()).nullable(),
	allergens_tags: z.array(z.string()).nullable(),
	brands: z.string().nullable(),
	brands_tags: z.array(z.string()).nullable(),
	categories: z.string().nullable(),
	categories_tags: z.array(z.string()).nullable(),
	categories_properties: z
		.object({
			ciqual_food_code: z.number().nullable(),
			agribalyse_food_code: z.number().nullable(),
			agribalyse_proxy_food_code: z.number().nullable(),
		})
		.nullable(),
	code: z.string().nullable(),
	completeness: z.number().nullable(),
	countries_tags: z.array(z.string()).nullable(),
	created_t: z.union([z.string(), z.number()]).nullable(),
	creator: z.string().nullable(),
	ecoscore_grade: z.string().nullable(),
	ecoscore_score: z.number().nullable(),
	generic_name: z
		.array(
			z.object({
				lang: z.string(),
				text: z.string(),
			}),
		)
		.nullable(),
	ingredients_n: z.number().nullable(),
	ingredients_text: z
		.array(
			z.object({
				lang: z.string(),
				text: z.string(),
			}),
		)
		.nullable(),
	last_modified_t: z.union([z.string(), z.number()]).nullable(),
	main_countries_tags: z.array(z.string()).nullable(),
	nutriments: z.array(NutrimentSchema).nullable(),
	nutriscore_grade: z.string().nullable(),
	nutriscore_score: z.number().nullable(),
	product_name: z
		.array(
			z.object({
				lang: z.string(),
				text: z.string(),
			}),
		)
		.nullable(),
	quantity: z.string().nullable(),
	serving_quantity: z.string().nullable(),
	serving_size: z.string().nullable(),
	stores: z.string().nullable(),
	nova_group: z.number().nullable(),
	popularity_key: z.union([z.string(), z.number()]).nullable(),
	scans_n: z.coerce.number().nullable(),
	unique_scans_n: z.coerce.number().nullable(),
});

export const FoodSearchSchema = z.object({
	code: z.string().nullable(),
	product_name: z.string().nullable(),
	brands: z.string().nullable(),
	categories: z.string().nullable(),
	nutriscore_grade: z.string().nullable(),
	scans_n: z.coerce.number().nullable(),
});

export const FoodSearchOutputSchema = z.array(FoodSearchSchema);

export type FoodProduct = z.infer<typeof FoodProductSchema>;
export type Nutriment = z.infer<typeof NutrimentSchema>;
