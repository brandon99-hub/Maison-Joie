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

async function importPickupLocations() {
  console.log("=========================================");
  console.log("   Import Pickup Mtaani Locations         ");
  console.log("=========================================\n");

  const jsonPath = path.resolve(__dirname, "..", "..", "pickup_mtaani_locations.json");
  if (!fs.existsSync(jsonPath)) {
    console.error("❌ pickup_mtaani_locations.json not found at:", jsonPath);
    process.exit(1);
  }

  const locations = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  console.log(`ℹ️ Loaded ${locations.length} locations from pickup_mtaani_locations.json\n`);

  const databaseUrl = getDatabaseUrl();
  const sql = neon(databaseUrl);

  let insertedCount = 0;
  let updatedCount = 0;
  const failed = [];

  for (const loc of locations) {
    try {
      const result = await sql`
        INSERT INTO pickup_mtaani_locations
          (id, agent_id, name, area, zone, address, delivery_fee, delivery_fee_min, delivery_fee_max,
           is_active, latitude, longitude, description, google_maps_url, data_source, last_scraped_at,
           created_at, updated_at)
        VALUES
          (${loc.id}, ${loc.agent_id}, ${loc.name}, ${loc.area}, ${loc.zone}, ${loc.address},
           ${loc.delivery_fee}, ${loc.delivery_fee_min}, ${loc.delivery_fee_max}, ${loc.is_active},
           ${loc.latitude}, ${loc.longitude}, ${loc.description}, ${loc.google_maps_url},
           ${loc.data_source}, ${loc.last_scraped_at}, ${loc.created_at}, ${loc.updated_at})
        ON CONFLICT (id) DO UPDATE SET
          agent_id = EXCLUDED.agent_id,
          name = EXCLUDED.name,
          area = EXCLUDED.area,
          zone = EXCLUDED.zone,
          address = EXCLUDED.address,
          delivery_fee = EXCLUDED.delivery_fee,
          delivery_fee_min = EXCLUDED.delivery_fee_min,
          delivery_fee_max = EXCLUDED.delivery_fee_max,
          is_active = EXCLUDED.is_active,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          description = EXCLUDED.description,
          google_maps_url = EXCLUDED.google_maps_url,
          data_source = EXCLUDED.data_source,
          last_scraped_at = EXCLUDED.last_scraped_at,
          updated_at = EXCLUDED.updated_at
        RETURNING (xmax = 0) AS inserted
      `;

      if (result[0]?.inserted) {
        insertedCount++;
      } else {
        updatedCount++;
      }
    } catch (error) {
      failed.push({ id: loc.id, name: loc.name, error: error.message });
    }
  }

  // Keep the serial id sequence ahead of the explicit ids we just inserted
  await sql`
    SELECT setval(
      pg_get_serial_sequence('pickup_mtaani_locations', 'id'),
      (SELECT MAX(id) FROM pickup_mtaani_locations)
    )
  `;

  const [{ count }] = await sql`SELECT COUNT(*) FROM pickup_mtaani_locations`;

  console.log("=========================================");
  console.log("   Import Complete                        ");
  console.log("=========================================");
  console.log(`Inserted : ${insertedCount}`);
  console.log(`Updated  : ${updatedCount}`);
  console.log(`Failed   : ${failed.length}`);
  console.log(`Total rows in table now: ${count}`);

  if (failed.length > 0) {
    console.log("\n❌ Failed rows:");
    console.table(failed);
  }

  console.log("\n✅ Done\n");
}

importPickupLocations().catch((error) => {
  console.error("\n❌ Error importing pickup locations:", error);
  process.exit(1);
});
