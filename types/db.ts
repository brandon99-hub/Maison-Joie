// Core Database Domain Models

export type Product = {
  id: number
  name: string
  slug: string
  description: string
  price: number
  category: string
  images: string[]
  is_secret: boolean
  is_active: boolean
  stock_quantity?: number
  low_stock_threshold?: number
  notify_on_low_stock?: boolean
  average_rating?: number
  review_count?: number
  wishlist_count?: number
  created_at: string
}

export type Order = {
  id: number
  reference_code: string
  customer_name: string
  phone_number: string
  pickup_location: string
  items: CartItem[]
  total_amount: number
  status: "pending" | "paid" | "packed" | "collected"
  mpesa_confirmed: boolean
  delivery_method?: "pickup" | "pickup_mtaani"
  delivery_fee?: number
  pickup_mtaani_location?: string | null
  address_type?: string | null
  estate_name?: string | null
  house_number?: string | null
  landmark?: string | null
  latitude?: number | null
  longitude?: number | null
  secret_code?: string | null
  has_bundle?: boolean
  customer_id?: number | null
  estimated_delivery?: string | null
  created_at: string
  updated_at: string
}

export type Testimonial = {
  id: number
  username: string
  profile_image: string
  message: string
  emoji_reactions: string
  is_active: boolean
  is_approved: boolean
  customer_id?: number | null
  created_at: string
}

export type SecretCode = {
  id: number
  code: string
  order_id: number | null
  discount_percent: number
  is_used: boolean
  is_scanned: boolean
  is_exported?: boolean
  scanned_at: string | null
  used_at: string | null
  expires_at: string | null
  created_at: string
}

export type CartItem = {
  product_id: number
  name: string
  quantity: number
  price: number
  image: string
  is_bundle?: boolean
}

export type Bundle = {
  id: number
  name: string
  description: string
  product_ids: number[]
  original_price: number
  bundle_price: number
  savings: number
  image: string | null
  is_active: boolean
  created_at: string
}

export type ProductReview = {
  id: number
  product_id: number
  customer_name: string
  rating: number
  review_text: string | null
  is_verified_purchase: boolean
  is_approved: boolean
  helpful_count: number
  created_at: string
}

export type WishlistItem = {
  id: number
  session_id: string | null
  customer_id: number | null
  product_id: number
  created_at: string
}

export type InventoryAlert = {
  id: number
  product_id: number
  alert_type: "low_stock" | "out_of_stock"
  previous_quantity: number | null
  current_quantity: number | null
  is_resolved: boolean
  resolved_at: string | null
  created_at: string
}

export type PickupMtaaniLocation = {
  id: number
  agent_id: string | null
  name: string
  area: string
  zone: string | null
  address: string | null
  delivery_fee: number
  delivery_fee_min?: number
  delivery_fee_max?: number
  is_active: boolean
  latitude: number | null
  longitude: number | null
  description: string | null
  google_maps_url: string | null
  has_gps?: boolean
  created_at: string
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  image: string | null
  display_order: number
  is_active: boolean
  created_at: string
}

export type Customer = {
  id: number
  email: string
  password_hash: string
  name: string | null
  phone_number: string | null
  created_at: string
  updated_at: string
}

export type CustomerAddress = {
  id: number
  customer_id: number
  address_type: string
  location: string
  location_name?: string | null
  estate_name?: string | null
  house_number?: string | null
  landmark?: string | null
  latitude?: number | null
  longitude?: number | null
  pickup_mtaani_id?: number | null
  phone_number: string | null
  is_default: boolean
  created_at: string
}

export type CustomerReview = {
  id: number
  product_id: number
  customer_id: number
  order_id: number
  rating: number
  review_text: string | null
  review_images: string[]
  is_verified: boolean
  is_approved: boolean
  created_at: string
  customer_name?: string
  customer_email?: string
  product_name?: string
}

export type ProductWaitlist = {
  id: number
  product_id: number
  customer_id: number
  email: string
  notified: boolean
  created_at: string
}

export type AbandonedCart = {
  id: number
  customer_id: number | null
  session_id: string | null
  cart_items: CartItem[]
  total_amount: number
  email_sent: boolean
  recovered: boolean
  created_at: string
  updated_at: string
}
