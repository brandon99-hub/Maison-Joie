import {
  pgTable,
  serial,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  index,
  unique,
} from "drizzle-orm/pg-core"

// 1. Categories Table (defined first so products can reference slug)
export const categories = pgTable(
  "categories",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 100 }).notNull().unique("categories_name_key"),
    slug: varchar("slug", { length: 100 }).notNull().unique("categories_slug_key"),
    description: text("description"),
    image: varchar("image", { length: 500 }),
    display_order: integer("display_order").default(0),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_categories_slug").on(table.slug),
    index("idx_categories_active").on(table.is_active),
    index("idx_categories_order").on(table.display_order),
  ]
)

// 2. Products Table
export const products = pgTable(
  "products",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull().unique("products_slug_key"),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    category: varchar("category", { length: 100 })
      .notNull()
      .references(() => categories.slug, { onDelete: "restrict", onUpdate: "cascade" }),
    images: text("images").array().default([]),
    is_secret: boolean("is_secret").default(false),
    secret_discount_percent: integer("secret_discount_percent"),
    is_active: boolean("is_active").default(true),
    stock_quantity: integer("stock_quantity").default(50),
    low_stock_threshold: integer("low_stock_threshold").default(10),
    notify_on_low_stock: boolean("notify_on_low_stock").default(true),
    average_rating: numeric("average_rating", { precision: 3, scale: 2 }).default("0"),
    review_count: integer("review_count").default(0),
    wishlist_count: integer("wishlist_count").default(0),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_products_category").on(table.category),
    index("idx_products_is_secret").on(table.is_secret),
  ]
)

// 3. Customers Table
export const customers = pgTable(
  "customers",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique("customers_email_key"),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    phone_number: varchar("phone_number", { length: 20 }),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_customers_email").on(table.email),
  ]
)

// 4. Orders Table
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    reference_code: varchar("reference_code", { length: 50 }).notNull().unique("orders_reference_code_key"),
    customer_name: varchar("customer_name", { length: 255 }).notNull(),
    phone_number: varchar("phone_number", { length: 20 }).notNull(),
    pickup_location: text("pickup_location").notNull(),
    items: jsonb("items").notNull(),
    total_amount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 50 }).default("pending"),
    mpesa_confirmed: boolean("mpesa_confirmed").default(false),
    delivery_method: varchar("delivery_method", { length: 50 }).default("pickup"),
    delivery_fee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
    pickup_mtaani_location: varchar("pickup_mtaani_location", { length: 255 }),
    address_type: text("address_type"),
    estate_name: text("estate_name"),
    house_number: text("house_number"),
    landmark: text("landmark"),
    latitude: doublePrecision("latitude"),
    longitude: doublePrecision("longitude"),
    has_bundle: boolean("has_bundle").default(false),
    secret_code: varchar("secret_code", { length: 50 }),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "set null" }),
    estimated_delivery: text("estimated_delivery"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_orders_status").on(table.status),
    index("idx_orders_reference").on(table.reference_code),
    index("idx_orders_customer").on(table.customer_id),
    index("idx_orders_has_bundle").on(table.has_bundle),
    index("idx_orders_secret_code").on(table.secret_code),
  ]
)

// 6. Testimonials Table
export const testimonials = pgTable(
  "testimonials",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull(),
    profile_image: varchar("profile_image", { length: 500 }),
    message: text("message").notNull(),
    emoji_reactions: varchar("emoji_reactions", { length: 100 }),
    is_active: boolean("is_active").default(true),
    is_approved: boolean("is_approved").default(true),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_testimonials_customer").on(table.customer_id),
  ]
)

// 7. Secret Codes Table
export const secretCodes = pgTable(
  "secret_codes",
  {
    id: serial("id").primaryKey(),
    code: varchar("code", { length: 100 }).notNull().unique("secret_codes_code_key"),
    order_id: integer("order_id").references(() => orders.id, { onDelete: "set null" }),
    discount_percent: integer("discount_percent").default(10),
    is_used: boolean("is_used").default(false),
    is_scanned: boolean("is_scanned").default(false),
    is_exported: boolean("is_exported").default(false),
    scanned_at: timestamp("scanned_at"),
    used_at: timestamp("used_at"),
    expires_at: timestamp("expires_at"),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_secret_codes_code").on(table.code),
  ]
)

// 8. Admin Users Table
export const adminUsers = pgTable(
  "admin_users",
  {
    id: serial("id").primaryKey(),
    username: varchar("username", { length: 100 }).notNull().unique("admin_users_username_key"),
    email: varchar("email", { length: 255 }).unique("admin_users_email_key"),
    password_hash: varchar("password_hash", { length: 255 }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
  }
)

// 9. Admin Login Attempts Table
export const adminLoginAttempts = pgTable(
  "admin_login_attempts",
  {
    id: serial("id").primaryKey(),
    identifier: varchar("identifier", { length: 255 }).notNull().unique("admin_login_attempts_identifier_key"),
    attempt_count: integer("attempt_count").default(1),
    last_attempt: timestamp("last_attempt").defaultNow(),
    locked_until: timestamp("locked_until"),
  },
  (table) => [
    index("idx_admin_login_attempts_identifier").on(table.identifier),
  ]
)

// 10. Bundles Table (Includes both image and bundle_image to avoid data loss warnings)
export const bundles = pgTable(
  "bundles",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    product_ids: integer("product_ids").array().notNull(),
    original_price: numeric("original_price", { precision: 10, scale: 2 }).notNull(),
    bundle_price: numeric("bundle_price", { precision: 10, scale: 2 }).notNull(),
    savings: numeric("savings", { precision: 10, scale: 2 }).notNull(),
    image: varchar("image", { length: 500 }),
    bundle_image: text("bundle_image"),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_bundles_active").on(table.is_active),
  ]
)

// 11. Wishlists Table
export const wishlists = pgTable(
  "wishlists",
  {
    id: serial("id").primaryKey(),
    session_id: varchar("session_id", { length: 255 }),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    product_id: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("wishlists_session_id_product_id_key").on(table.session_id, table.product_id),
    index("idx_wishlist_session").on(table.session_id),
    index("idx_wishlist_customer").on(table.customer_id),
    index("idx_wishlist_product").on(table.product_id),
  ]
)

// 12. Password Reset Tokens Table
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: serial("id").primaryKey(),
    user_id: integer("user_id").references(() => adminUsers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }),
    token: varchar("token", { length: 255 }).notNull().unique("password_reset_tokens_token_key"),
    expires_at: timestamp("expires_at").notNull(),
    used: boolean("used").default(false),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_password_reset_tokens_token").on(table.token),
    index("idx_password_reset_tokens_user_id").on(table.user_id),
  ]
)

// 13. Pickup Mtaani Locations Table
export const pickupMtaaniLocations = pgTable(
  "pickup_mtaani_locations",
  {
    id: serial("id").primaryKey(),
    agent_id: integer("agent_id").unique("pickup_mtaani_locations_agent_id_key"),
    name: varchar("name", { length: 255 }).notNull(),
    area: varchar("area", { length: 255 }).notNull(),
    zone: varchar("zone", { length: 255 }),
    address: text("address"),
    delivery_fee: numeric("delivery_fee", { precision: 10, scale: 2 }).default("0"),
    delivery_fee_min: numeric("delivery_fee_min", { precision: 10, scale: 2 }).default("180.00"),
    delivery_fee_max: numeric("delivery_fee_max", { precision: 10, scale: 2 }).default("250.00"),
    is_active: boolean("is_active").default(true),
    latitude: numeric("latitude", { precision: 10, scale: 8 }),
    longitude: numeric("longitude", { precision: 11, scale: 8 }),
    description: text("description"),
    google_maps_url: text("google_maps_url"),
    last_scraped_at: timestamp("last_scraped_at"),
    data_source: varchar("data_source", { length: 50 }).default("manual"),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  },
  (table) => [
    index("idx_pickup_locations_active").on(table.is_active),
    index("idx_pickup_locations_agent_id").on(table.agent_id),
  ]
)

// 14. App Settings Table
export const appSettings = pgTable(
  "app_settings",
  {
    id: serial("id").primaryKey(),
    setting_key: varchar("setting_key", { length: 100 }).notNull().unique("app_settings_setting_key_key"),
    setting_value: text("setting_value").notNull(),
    updated_at: timestamp("updated_at").defaultNow(),
  }
)

// 15. Customer Addresses Table
export const customerAddresses = pgTable(
  "customer_addresses",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
    address_type: varchar("address_type", { length: 50 }).default("delivery"),
    location: text("location").notNull(),
    phone_number: varchar("phone_number", { length: 20 }),
    is_default: boolean("is_default").default(false),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    index("idx_addresses_customer").on(table.customer_id),
  ]
)

// 16. Customer Reviews Table
export const customerReviews = pgTable(
  "customer_reviews",
  {
    id: serial("id").primaryKey(),
    product_id: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }).notNull(),
    order_id: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    review_text: text("review_text"),
    review_images: text("review_images").array(),
    is_verified: boolean("is_verified").default(true),
    is_approved: boolean("is_approved").default(true),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("customer_reviews_product_id_customer_id_order_id_key").on(
      table.product_id,
      table.customer_id,
      table.order_id
    ),
    index("idx_reviews_product").on(table.product_id),
    index("idx_reviews_customer").on(table.customer_id),
    index("idx_reviews_approved").on(table.is_approved),
  ]
)

// 17. Product Waitlists Table
export const productWaitlists = pgTable(
  "product_waitlists",
  {
    id: serial("id").primaryKey(),
    product_id: integer("product_id").references(() => products.id, { onDelete: "cascade" }).notNull(),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    notified: boolean("notified").default(false),
    created_at: timestamp("created_at").defaultNow(),
  },
  (table) => [
    unique("product_waitlists_product_id_customer_id_key").on(table.product_id, table.customer_id),
    index("idx_waitlist_product").on(table.product_id),
    index("idx_waitlist_customer").on(table.customer_id),
  ]
)

// 18. Abandoned Carts Table
export const abandonedCarts = pgTable(
  "abandoned_carts",
  {
    id: serial("id").primaryKey(),
    customer_id: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
    session_id: varchar("session_id", { length: 255 }),
    cart_items: jsonb("cart_items").notNull(),
    total_amount: numeric("total_amount", { precision: 10, scale: 2 }),
    email_sent: boolean("email_sent").default(false),
    recovered: boolean("recovered").default(false),
    created_at: timestamp("created_at").defaultNow(),
    updated_at: timestamp("updated_at").defaultNow(),
  }
)
