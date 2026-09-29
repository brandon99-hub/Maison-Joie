const { neon } = require("@neondatabase/serverless");
const fs = require("fs");
const path = require("path");

// Load DATABASE_URL from .env in project root
function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = path.resolve(__dirname, "..", "..", ".env");
  if (!fs.existsSync(envPath)) {
    console.error("❌ .env file not found at:", envPath);
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, "utf8");
  const match = envContent.match(/DATABASE_URL=(.+)/);
  if (!match) {
    console.error("❌ DATABASE_URL not found in .env");
    process.exit(1);
  }
  let url = match[1].trim();
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1);
  }
  return url;
}

const categories = [
  { name: "Dior", slug: "dior", description: "Timeless French elegance — iconic fragrances from the house of Dior.", display_order: 1 },
  { name: "Chanel", slug: "chanel", description: "Legendary Parisian perfumery, defining sophistication since 1921.", display_order: 2 },
  { name: "Tom Ford", slug: "tom-ford", description: "Bold, luxurious scents for the modern connoisseur.", display_order: 3 },
  { name: "YSL", slug: "ysl", description: "Daring and seductive fragrances from Yves Saint Laurent.", display_order: 4 },
]

const products = [
  // Dior
  { name: "Dior Sauvage Eau de Toilette", slug: "dior-sauvage-edt", category: "dior", price: 9500, stock_quantity: 25, description: "A radically fresh composition with notes of Calabrian bergamot and ambroxan, evoking wide-open spaces under a beating sun." },
  { name: "Dior J'adore Eau de Parfum", slug: "dior-jadore-edp", category: "dior", price: 10500, stock_quantity: 18, description: "An iconic floral bouquet of ylang-ylang, Damascus rose, and jasmine — pure femininity in a bottle." },
  { name: "Miss Dior Eau de Parfum", slug: "miss-dior-edp", category: "dior", price: 8000, stock_quantity: 20, description: "A modern floral fragrance built around a Grasse rose heart, romantic and audacious." },
  { name: "Dior Homme Intense", slug: "dior-homme-intense", category: "dior", price: 9800, stock_quantity: 12, description: "A refined, powdery iris fragrance with warm amber and vetiver for the modern gentleman." },
  // Chanel
  { name: "Chanel No. 5 Eau de Parfum", slug: "chanel-no5-edp", category: "chanel", price: 12000, stock_quantity: 15, description: "The world's most iconic fragrance — a timeless bouquet of aldehydes, jasmine, and sandalwood." },
  { name: "Bleu de Chanel Eau de Parfum", slug: "bleu-de-chanel-edp", category: "chanel", price: 11500, stock_quantity: 22, description: "A woody aromatic fragrance of exceptional freshness, with citrus, cedar, and sandalwood." },
  { name: "Coco Mademoiselle Eau de Parfum", slug: "coco-mademoiselle-edp", category: "chanel", price: 11000, stock_quantity: 16, description: "An oriental-vetiver fragrance with a fresh, sensual character — orange, jasmine, and patchouli." },
  { name: "Chanel Chance Eau Tendre", slug: "chanel-chance-eau-tendre", category: "chanel", price: 10000, stock_quantity: 19, description: "A delicate, tender floral fragrance of quince, jasmine, and white musk." },
  // Tom Ford
  { name: "Tom Ford Black Orchid Eau de Parfum", slug: "tom-ford-black-orchid", category: "tom-ford", price: 14000, stock_quantity: 10, description: "A luxurious, sensual blend of black truffle, ylang-ylang, and dark chocolate — opulent and unforgettable." },
  { name: "Tom Ford Oud Wood Eau de Parfum", slug: "tom-ford-oud-wood", category: "tom-ford", price: 16500, stock_quantity: 8, description: "A modern take on the ancient oud, blended with rosewood, sandalwood, and vanilla." },
  { name: "Tom Ford Tobacco Vanille", slug: "tom-ford-tobacco-vanille", category: "tom-ford", price: 15500, stock_quantity: 9, description: "A rich, opulent spice fragrance with tobacco leaf, vanilla, and dried fruit — warm and inviting." },
  { name: "Tom Ford Neroli Portofino", slug: "tom-ford-neroli-portofino", category: "tom-ford", price: 13500, stock_quantity: 14, description: "A sparkling, sun-drenched fragrance capturing the essence of the Italian coast." },
  // YSL
  { name: "YSL Black Opium Eau de Parfum", slug: "ysl-black-opium", category: "ysl", price: 9000, stock_quantity: 21, description: "An addictive gourmand fragrance of black coffee, white flowers, and vanilla." },
  { name: "YSL Libre Eau de Parfum", slug: "ysl-libre", category: "ysl", price: 9200, stock_quantity: 17, description: "A bold floral fougère blend of lavender and orange blossom — the scent of freedom." },
  { name: "YSL Y Eau de Parfum", slug: "ysl-y-edp", category: "ysl", price: 8800, stock_quantity: 13, description: "A fresh, powerful fragrance of apple, sage, and ginger for the self-made man." },
  { name: "YSL La Nuit de L'Homme", slug: "ysl-la-nuit-de-lhomme", category: "ysl", price: 7800, stock_quantity: 16, description: "A seductive, spicy fragrance of cardamom, bergamot, and cedar for the night." },
]

async function seedCatalog() {
  console.log("=========================================");
  console.log("   Seed Perfume Catalog                   ");
  console.log("=========================================\n");

  const databaseUrl = getDatabaseUrl();
  const sql = neon(databaseUrl);

  let categoriesInserted = 0;
  let categoriesUpdated = 0;
  const categoryFailures = [];

  for (const cat of categories) {
    try {
      const result = await sql`
        INSERT INTO categories (name, slug, description, display_order, is_active)
        VALUES (${cat.name}, ${cat.slug}, ${cat.description}, ${cat.display_order}, true)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          display_order = EXCLUDED.display_order,
          is_active = EXCLUDED.is_active
        RETURNING (xmax = 0) AS inserted
      `;
      if (result[0]?.inserted) categoriesInserted++;
      else categoriesUpdated++;
    } catch (error) {
      categoryFailures.push({ slug: cat.slug, error: error.message });
    }
  }

  let productsInserted = 0;
  let productsUpdated = 0;
  const productFailures = [];

  for (const p of products) {
    try {
      const result = await sql`
        INSERT INTO products (name, slug, description, price, category, images, stock_quantity, is_active, is_secret)
        VALUES (${p.name}, ${p.slug}, ${p.description}, ${p.price}, ${p.category}, ${[]}, ${p.stock_quantity}, true, false)
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          category = EXCLUDED.category,
          stock_quantity = EXCLUDED.stock_quantity,
          is_active = EXCLUDED.is_active
        RETURNING (xmax = 0) AS inserted
      `;
      if (result[0]?.inserted) productsInserted++;
      else productsUpdated++;
    } catch (error) {
      productFailures.push({ slug: p.slug, error: error.message });
    }
  }

  const [{ count: categoryCount }] = await sql`SELECT COUNT(*) FROM categories`;
  const [{ count: productCount }] = await sql`SELECT COUNT(*) FROM products`;

  console.log("=========================================");
  console.log("   Seed Complete                          ");
  console.log("=========================================");
  console.log(`Categories: ${categoriesInserted} inserted, ${categoriesUpdated} updated, ${categoryFailures.length} failed`);
  console.log(`Products  : ${productsInserted} inserted, ${productsUpdated} updated, ${productFailures.length} failed`);
  console.log(`Total categories in DB: ${categoryCount}`);
  console.log(`Total products in DB  : ${productCount}`);

  if (categoryFailures.length > 0) {
    console.log("\n❌ Failed categories:");
    console.table(categoryFailures);
  }
  if (productFailures.length > 0) {
    console.log("\n❌ Failed products:");
    console.table(productFailures);
  }

  console.log("\n✅ Done\n");
}

seedCatalog().catch((error) => {
  console.error("\n❌ Error seeding catalog:", error);
  process.exit(1);
});
