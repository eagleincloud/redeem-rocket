// AI-Powered Product Builder

import { generateSampleProducts } from './llm.ts';

export async function buildProductsFromWebsite(
  url: string,
  businessType: string,
  businessName: string
): Promise<any[]> {
  try {
    console.log(`[buildProductsFromWebsite] Building products for ${businessName}`);

    const products = await generateSampleProducts(businessType, businessName, '');

    console.log(`[buildProductsFromWebsite] Generated ${products.length} products`);

    const validProducts = products
      .filter((p: any) => p.name && p.description && p.category)
      .map((p: any) => ({
        name: p.name,
        description: p.description,
        category: p.category,
        price: p.price || 0,
        created_from_ai: true,
      }));

    return validProducts;
  } catch (error) {
    console.error('[buildProductsFromWebsite] Error:', error);
    return [];
  }
}
