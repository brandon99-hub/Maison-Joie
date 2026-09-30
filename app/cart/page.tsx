"use client"

import { useState, useEffect, Suspense, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  MapPin,
  Building2,
  Check,
  Search,
  Info,
  Phone,
  Truck,
  Store,
  AlertCircle,
  MessageCircle,
  Loader2,
  ChevronLeft,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerTrigger,
  DrawerClose,
  DrawerFooter
} from "@/components/ui/drawer"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useCart } from "@/providers"
import type { PickupMtaaniLocation, CustomerAddress } from "@/lib/db"
import { getCustomerAddresses, getCustomerProfile } from "@/app/dashboard/actions"
import { WHATSAPP_NUMBER } from "@/lib/whatsapp"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { createOrder } from "@/app/checkout/actions"
import { AgentSelectionModal, sanitizeDescription } from "@/components/agent-selection-modal"


function CartContent() {
  const { data: session } = useSession()
  const { items, removeItem, updateQuantity, totalAmount, addItem, clearCart } = useCart()
  const [locations, setLocations] = useState<PickupMtaaniLocation[]>([])
  const [addresses, setAddresses] = useState<CustomerAddress[]>([])
  const [selectedLocation, setSelectedLocation] = useState<PickupMtaaniLocation | null>(null)
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null)
  const [manualAddress, setManualAddress] = useState({
    location: '',
    estate: '',
    houseNumber: '',
    landmark: ''
  })
  const [suggestedAgent, setSuggestedAgent] = useState<PickupMtaaniLocation | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'door'>('pickup')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [calculatingFee, setCalculatingFee] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const isReorder = searchParams.get('reorder') === 'true'

  // Fetch Pickup Mtaani locations and Customer addresses + Auto-fill Profile
  useEffect(() => {
    async function fetchData() {
      try {
        // Check cache first
        const cachedData = localStorage.getItem('pickup_locations_cache')
        const cacheTimestamp = localStorage.getItem('pickup_locations_cache_timestamp')
        const now = Date.now()
        const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

        // Use cache if valid (less than 24 hours old)
        if (cachedData && cacheTimestamp && (now - parseInt(cacheTimestamp)) < CACHE_DURATION) {
          const parsedData = JSON.parse(cachedData)
          setLocations(parsedData)
        } else {
          // Fetch fresh data if cache is stale or missing
          const response = await fetch("/api/pickup-locations")
          if (response.ok) {
            const data = await response.json()
            const locations = data.locations || []
            setLocations(locations)

            // Cache the data
            localStorage.setItem('pickup_locations_cache', JSON.stringify(locations))
            localStorage.setItem('pickup_locations_cache_timestamp', now.toString())
          }
        }

        if (session) {
          // Cache keys for user-specific data
          const userId = session.user?.id || 'guest'
          const addressCacheKey = `customer_addresses_${userId}`
          const addressCacheTimestamp = `customer_addresses_timestamp_${userId}`
          const profileCacheKey = `customer_profile_${userId}`
          const ADDRESSES_CACHE_DURATION = 60 * 60 * 1000 // 1 hour

          // Check address cache
          const cachedAddresses = localStorage.getItem(addressCacheKey)
          const addressTimestamp = localStorage.getItem(addressCacheTimestamp)
          let addrResult: any = null

          if (cachedAddresses && addressTimestamp && (now - parseInt(addressTimestamp)) < ADDRESSES_CACHE_DURATION) {
            // Use cached addresses
            addrResult = { success: true, addresses: JSON.parse(cachedAddresses) }
            setAddresses(JSON.parse(cachedAddresses))
          } else {
            // Fetch fresh addresses
            addrResult = await getCustomerAddresses()
            if (addrResult.success && addrResult.addresses) {
              setAddresses(addrResult.addresses)
              // Cache addresses
              localStorage.setItem(addressCacheKey, JSON.stringify(addrResult.addresses))
              localStorage.setItem(addressCacheTimestamp, now.toString())
            }
          }

          // Check profile cache (use sessionStorage for profile - lasts for session)
          const cachedProfile = sessionStorage.getItem(profileCacheKey)
          let profileResult: any = null

          if (cachedProfile) {
            // Use cached profile
            profileResult = { success: true, customer: JSON.parse(cachedProfile) }
          } else {
            // Fetch fresh profile
            profileResult = await getCustomerProfile()
            if (profileResult.success && profileResult.customer) {
              // Cache profile in sessionStorage
              sessionStorage.setItem(profileCacheKey, JSON.stringify(profileResult.customer))
            }
          }

          // Consolidated Reliable Auto-fill
          setFormData(prev => {
            const profileName = profileResult.success ? profileResult.customer?.name : null;
            const profilePhone = profileResult.success ? profileResult.customer?.phone_number : null;
            const sessionName = session.user?.name || "";
            const sessionPhone = (session.user as any)?.phone || null;

            // Fallback phone from addresses with safe checks
            const addressPhone = (addrResult.success && addrResult.addresses && addrResult.addresses.length > 0)
              ? (addrResult.addresses.find((a: any) => a.is_default) || addrResult.addresses[0]).phone_number
              : null;

            return {
              name: prev.name || profileName || sessionName || "",
              phone: prev.phone || profilePhone || sessionPhone || addressPhone || ""
            };
          });
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }
    fetchData()
  }, [session])

  // Handle reorder items
  useEffect(() => {
    if (isReorder) {
      const reorderItems = localStorage.getItem('reorder_items')
      if (reorderItems) {
        try {
          const itemsArr = JSON.parse(reorderItems)
          itemsArr.forEach((item: any) => {
            addItem({
              product_id: item.product_id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image || "",
            })
          })
          localStorage.removeItem('reorder_items')
          toast.success("Order items added to cart!")
        } catch (error) {
          console.error('Failed to load reorder items:', error)
        }
      }
    }
  }, [isReorder, addItem])

  // Auto-select location after locations are loaded
  useEffect(() => {
    if (isReorder && locations.length > 0) {
      const reorderLocationId = localStorage.getItem('reorder_location_id')
      if (reorderLocationId) {
        const loc = locations.find(l => l.id === parseInt(reorderLocationId))
        if (loc) {
          setSelectedLocation(loc)
          localStorage.removeItem('reorder_location_id')
        }
      }
    }

    // Auto-detect delivery method based on default address
    if (addresses.length > 0) {
      const defaultAddress = addresses.find(a => a.is_default) || addresses[0]
      if (defaultAddress) {
        // Set delivery method based on address type
        if (defaultAddress.address_type === 'pickup_mtaani') {
          setDeliveryMethod('pickup')
        } else if (defaultAddress.address_type === 'door_to_door') {
          setDeliveryMethod('door')
        }
      }
    }

    // Auto-fill pickup location from saved addresses using pickup_mtaani_id
    if (locations.length > 0 && addresses.length > 0 && !selectedLocation && !isReorder) {
      // Prioritize addresses marked for pickup_mtaani
      const pickupAddresses = addresses.filter(a => a.address_type === 'pickup_mtaani')

      if (pickupAddresses.length > 0) {
        // Get default pickup address or first one
        const defaultPickupAddr = pickupAddresses.find(a => a.is_default) || pickupAddresses[0]

        // Use explicit pickup_mtaani_id for reliable matching
        if (defaultPickupAddr.pickup_mtaani_id) {
          const matchedLoc = locations.find(loc => loc.id === defaultPickupAddr.pickup_mtaani_id)
          if (matchedLoc) {
            setSelectedLocation(matchedLoc)
          }
        }
      }
    }
  }, [isReorder, locations, addresses, selectedLocation])

  // Dynamic Fee Calculation
  useEffect(() => {
    async function updateFee() {
      if (!selectedLocation) return

      setCalculatingFee(true)
      try {
        const response = await fetch("/api/shipping/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            destination_agent_id: selectedLocation.id,
            cart_total: totalAmount,
            cart_items: items.reduce((sum, item) => sum + item.quantity, 0)
          })
        })

        if (response.ok) {
          const data = await response.json()
          // Update the local selectedLocation with the new calculated fee
          setSelectedLocation(prev => prev ? {
            ...prev,
            delivery_fee: data.delivery_fee,
            delivery_fee_min: data.delivery_fee_min,
            delivery_fee_max: data.delivery_fee_max
          } : null)
        }
      } catch (error) {
        console.error("Fee calculation error:", error)
      } finally {
        setCalculatingFee(false)
      }
    }
    updateFee()
  }, [selectedLocation?.id, items.length, totalAmount])

  const handleSendOrder = async () => {
    if (deliveryMethod === 'pickup' && !selectedLocation) {
      toast.error("Please select a pickup agent")
      return
    }

    if (!session && (!formData.name || !formData.phone)) {
      toast.error("Please provide your name and phone number")
      return
    }

    setLoading(true)
    try {
      // Format phone number logic to be consistent with success page expectation
      let formattedPhone = formData.phone.replace(/\s/g, "").replace(/\+/g, "")
      if (formattedPhone.startsWith("254") && formattedPhone.length > 9) {
        formattedPhone = "0" + formattedPhone.substring(3)
      }
      if (formattedPhone.length > 0 && !formattedPhone.startsWith("0")) {
        formattedPhone = "0" + formattedPhone
      }

      const result = await createOrder({
        customerName: session?.user?.name || formData.name,
        phoneNumber: formattedPhone,
        pickupLocation: deliveryMethod === 'door'
          ? (selectedAddress?.location || manualAddress.location || "Door to Door Service")
          : (selectedLocation?.name || "Pickup Mtaani Agent"),
        deliveryMethod: deliveryMethod === 'door' ? 'door-to-door' : 'pickup-mtaani',
        deliveryFee: Number(selectedLocation?.delivery_fee_min || 0),
        pickupMtaaniLocationId: selectedLocation?.id,
        address_type: deliveryMethod === 'door' ? (selectedAddress?.address_type || 'door_to_door') : 'pickup_mtaani',
        estate_name: deliveryMethod === 'door' ? (selectedAddress?.estate_name || manualAddress.estate || undefined) : undefined,
        house_number: deliveryMethod === 'door' ? (selectedAddress?.house_number || manualAddress.houseNumber || undefined) : undefined,
        landmark: deliveryMethod === 'door' ? (selectedAddress?.landmark || manualAddress.landmark || undefined) : undefined,
        latitude: deliveryMethod === 'door' ? (selectedAddress?.latitude || undefined) : undefined,
        longitude: deliveryMethod === 'door' ? (selectedAddress?.longitude || undefined) : undefined,
        items: items.map(item => ({
          ...item,
          price: Number(item.price),
          quantity: Number(item.quantity),
          image: item.image || "",
        })),
        totalAmount: Number(totalAmount) + Number(selectedLocation?.delivery_fee_min || 0),
        secretCode: typeof window !== 'undefined' ? localStorage.getItem('active_secret_code') || undefined : undefined,
      }, session?.user?.id ? parseInt(session.user.id) : undefined)

      if (result.success && result.referenceCode) {
        // 1. Generate Highly Detailed WhatsApp Message
        const itemsList = items.map((item, index) => {
          const itemTotal = Number(item.price) * item.quantity;
          return `${index + 1}. ${item.name} (${item.quantity} x KES ${Number(item.price).toLocaleString()}) = KES ${itemTotal.toLocaleString()}`;
        }).join('\n');

        let deliveryNote = ""
        if (deliveryMethod === 'door') {
          const addrParts = []
          if (selectedAddress?.location || manualAddress.location) addrParts.push(selectedAddress?.location || manualAddress.location)
          if (selectedAddress?.estate_name || manualAddress.estate) addrParts.push(`Estate: ${selectedAddress?.estate_name || manualAddress.estate}`)
          if (selectedAddress?.house_number || manualAddress.houseNumber) addrParts.push(`House: ${selectedAddress?.house_number || manualAddress.houseNumber}`)
          if (selectedAddress?.landmark || manualAddress.landmark) addrParts.push(`Landmark: ${selectedAddress?.landmark || manualAddress.landmark}`)

          deliveryNote = `🚚 DOOR-TO-DOOR\n📍 Address: ${addrParts.join(', ') || "Door to Door Service"}`
        } else {
          deliveryNote = `📍 PICKUP: ${selectedLocation?.name || "Pickup Mtaani Agent"}`
        }

        const message =
          `Hi Maison Joie! 👋
 
 I've just placed an order:
 📦 REFERENCE: ${result.referenceCode}
 
 ORDER SUMMARY:
 ${itemsList}
 
 💰 SUBTOTAL: KES ${totalAmount.toLocaleString()}
 🛵 DELIVERY:
 ${deliveryNote}
 
 Please confirm my exact total with delivery fees so I can pay! 🙏`;

        // 2. Open WhatsApp immediately
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, "_blank")

        // 3. Clear cart and redirect
        clearCart()

        if (typeof window !== 'undefined') localStorage.removeItem('active_secret_code')
        router.push(`/success/${result.referenceCode}`)
      } else {
        toast.error(result.error || "Failed to create order.")
      }
    } catch (error) {
      console.error("Order creation error:", error)
      toast.error("Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const deliveryFeeMin = deliveryMethod === 'pickup' ? (selectedLocation?.delivery_fee_min || 0) : 0
  const deliveryFeeMax = deliveryMethod === 'pickup' ? (selectedLocation?.delivery_fee_max || 0) : 0

  const estimatedTotalMin = Number(totalAmount) + Number(deliveryFeeMin)
  const estimatedTotalMax = Number(totalAmount) + Number(deliveryFeeMax)

  if (items.length === 0) {
    return (
      <div className="py-16 px-4 text-center">
        <div className="container mx-auto max-w-md">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Time to treat yourself!</p>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/shop">
              Start Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-lg">
        <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-4 mb-8">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item.product_id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex gap-4 bg-muted/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50 shadow-sm"
              >
                <div className="relative w-20 h-20 shrink-0">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    fill
                    className="rounded-xl object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1 leading-tight">{item.name}</h3>
                  <p className="text-primary font-bold text-sm">KES {item.price.toLocaleString()}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 bg-background rounded-full border border-border p-0.5">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Delivery Method Selector */}
        <div className="space-y-4 mb-6">
          <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-1">Delivery Method</Label>
          <Tabs value={deliveryMethod} onValueChange={(v) => setDeliveryMethod(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="pickup" className="rounded-lg gap-2 data-[state=active]:shadow-md">
                <Store className="h-4 w-4" />
                <span className="font-semibold">Pickup Agent</span>
              </TabsTrigger>
              <TabsTrigger value="door" className="rounded-lg gap-2 data-[state=active]:shadow-md">
                <Truck className="h-4 w-4" />
                <span className="font-semibold">Door-to-Door</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Conditional Content: Pickup Mtaani */}
          {deliveryMethod === 'pickup' && (
            <div className="space-y-4">
              {/* Proximity Suggestion - Disabled due to accuracy concerns
              {suggestedAgent && !selectedLocation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest">Suggested Nearby</p>
                      <p className="text-sm font-bold truncate max-w-[150px]">{suggestedAgent.name}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedLocation(suggestedAgent)}
                    className="text-primary font-black text-[10px] uppercase hover:bg-primary/10"
                  >
                    Use this
                  </Button>
                </motion.div>
              )} */}

              <div className="bg-muted/40 rounded-3xl p-5 border border-border/50 shadow-sm space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Collection Point</Label>
                    {selectedLocation && (
                      <button onClick={() => setIsModalOpen(true)} className="text-[10px] font-bold text-primary hover:underline uppercase">Change</button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={cn(
                      "w-full flex items-center justify-between bg-background p-4 rounded-2xl border-2 transition-all text-left",
                      selectedLocation ? "border-primary" : "border-border hover:border-primary/50"
                    )}
                  >
                    {selectedLocation ? (
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-sm truncate">{selectedLocation.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{selectedLocation.area}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                          <Search className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium">Select Pickup Agent...</span>
                      </div>
                    )}
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-30" />
                  </button>

                  <AgentSelectionModal
                    isOpen={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    locations={locations}
                    selectedLocation={selectedLocation}
                    onSelect={(loc) => {
                      setSelectedLocation(loc)
                      setIsModalOpen(false)
                    }}
                  />
                </div>

                {selectedLocation && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/60 border border-border rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex gap-3">
                      <div className="bg-blue-50 text-blue-600 p-2 rounded-xl h-fit">
                        <Info className="h-4 w-4" />
                      </div>
                      <div className="text-xs">
                        <p className="font-black text-blue-900/40 uppercase tracking-widest text-[9px] mb-1">Agent Instructions</p>
                        <p className="text-muted-foreground leading-relaxed italic pr-2 font-medium">
                          {selectedLocation.description || "Collection point."}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-4">
                          {selectedLocation.google_maps_url && (
                            <a href={selectedLocation.google_maps_url} target="_blank" rel="noopener noreferrer" className="bg-sky-50 text-sky-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-sky-100 hover:bg-sky-100 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                              <MapPin className="h-3 w-3" /> Exact GPS
                            </a>
                          )}
                          {selectedLocation.description && selectedLocation.description.match(/(\+?254|0)[17]\d{8}/) && (
                            <a href={`tel:${selectedLocation.description.match(/(\+?254|0)[17]\d{8}/)?.[0]}`} className="bg-green-50 text-green-700 text-[10px] font-black px-3 py-1.5 rounded-lg border border-green-100 hover:bg-green-100 transition-colors uppercase tracking-wider flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> Call Agent
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="bg-gradient-to-r from-primary/5 to-pink-500/5 rounded-2xl p-3 border border-primary/5">
                  <p className="text-[9px] text-center text-muted-foreground font-black uppercase tracking-[0.15em]">
                    Verified Pickup Mtaani Rates: <span className="text-primary">100 - 450 KES</span>
                  </p>
                </div>

                {/* Contact Information Accordion - Below Pickup Selection */}
                <Accordion type="single" collapsible defaultValue="contact" className="w-full">
                  <AccordionItem value="contact" className="border-none bg-white/60 backdrop-blur-sm rounded-2xl border border-border px-4 shadow-sm">
                    <AccordionTrigger className="hover:no-underline py-3.5">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Contact Details</p>
                          <p className="text-xs font-bold leading-none">
                            {formData.name || "Enter Name"} • {formData.phone || "Enter Phone"}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pt-1">
                      <div className="space-y-3">
                        <div className="relative group">
                          <Input
                            placeholder="Your Full Name"
                            className="bg-background h-10 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div className="relative group">
                          <Input
                            placeholder="M-Pesa Number (07XX XXX XXX)"
                            className="bg-background h-10 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground italic leading-tight">
                          We'll use this to send your order summary and confirm payment via WhatsApp.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </div>
          )}

          {/* Conditional Content: Door to Door */}
          {deliveryMethod === 'door' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="bg-white/80 rounded-[2rem] p-6 border-2 border-border border-dashed space-y-5 text-center shadow-xl shadow-muted/20">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg rotate-3">
                  <Truck className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-black text-xl">Courier Delivery</h3>
                  <p className="text-sm text-muted-foreground px-4 leading-relaxed font-medium">
                    {addresses.some(a => a.address_type === 'door_to_door')
                      ? "Pick one of your saved delivery addresses below for a faster checkout."
                      : "Direct doorstep delivery via Uber, Bolt or G4S. Secure and fast."
                    }
                  </p>
                </div>

                {addresses.some(a => a.address_type === 'door_to_door') && (
                  <div className="bg-muted/30 p-2 rounded-2xl border border-border/50">
                    <div className="flex flex-col gap-2">
                      {addresses
                        .filter(addr => addr.address_type === 'door_to_door')
                        .map(addr => (
                          <button
                            key={addr.id}
                            onClick={() => {
                              setSelectedAddress(addr)
                              setManualAddress({ location: '', estate: '', houseNumber: '', landmark: '' })
                            }}
                            className={cn(
                              "p-3 rounded-xl border transition-all text-left flex items-center gap-3 active:scale-95 w-full",
                              selectedAddress?.id === addr.id
                                ? "bg-primary/5 border-primary shadow-sm"
                                : "bg-white border-border hover:border-primary/50"
                            )}
                          >
                            <div className={cn(
                              "p-2 rounded-lg transition-colors",
                              selectedAddress?.id === addr.id ? "bg-primary text-white" : "bg-rose-50 text-rose-500"
                            )}>
                              <MapPin className="h-4 w-4" />
                            </div>
                            <div className="truncate flex-1">
                              <p className="font-bold text-xs truncate">{addr.location}</p>
                              {addr.phone_number && (
                                <p className="text-[9px] text-muted-foreground uppercase font-medium">{addr.phone_number}</p>
                              )}
                            </div>
                            {selectedAddress?.id === addr.id && (
                              <div className="bg-primary rounded-full p-0.5">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </button>
                        ))}

                      <button
                        onClick={() => setSelectedAddress(null)}
                        className={cn(
                          "p-3 rounded-xl border transition-all text-left flex items-center gap-3 active:scale-95 w-full",
                          !selectedAddress
                            ? "bg-primary/5 border-primary shadow-sm"
                            : "bg-white border-border hover:border-primary/50"
                        )}
                      >
                        <div className={cn(
                          "p-2 rounded-lg transition-colors",
                          !selectedAddress ? "bg-primary text-white" : "bg-slate-50 text-slate-500"
                        )}>
                          <Plus className="h-4 w-4" />
                        </div>
                        <div className="truncate flex-1">
                          <p className="font-bold text-xs truncate">Use Different Address</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-medium">Enter details manually</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {!selectedAddress && (
                  <div className="space-y-3 pt-2 text-left">
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
                      <Input
                        placeholder="General Location (e.g. Kilimani, Nairobi)"
                        className="bg-white h-11 pl-10 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm font-bold"
                        value={manualAddress.location}
                        onChange={(e) => setManualAddress(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        placeholder="Estate Name"
                        className="bg-white h-11 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                        value={manualAddress.estate}
                        onChange={(e) => setManualAddress(prev => ({ ...prev, estate: e.target.value }))}
                      />
                      <Input
                        placeholder="House Number"
                        className="bg-white h-11 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                        value={manualAddress.houseNumber}
                        onChange={(e) => setManualAddress(prev => ({ ...prev, houseNumber: e.target.value }))}
                      />
                    </div>
                    <Input
                      placeholder="Nearest Landmark (Optional)"
                      className="bg-white h-11 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm italic"
                      value={manualAddress.landmark}
                      onChange={(e) => setManualAddress(prev => ({ ...prev, landmark: e.target.value }))}
                    />
                  </div>
                )}

                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                  <p className="text-xs font-black text-primary uppercase tracking-widest">Real-Time Pricing</p>
                  <p className="text-[10px] text-muted-foreground mt-1 tracking-tight font-medium">
                    Standard rates between <span className="font-bold underline">250 - 500 KES</span> in Nairobi.
                  </p>
                </div>
              </div>

              {/* Contact Information Accordion - Below Door to Door */}
              <Accordion type="single" collapsible defaultValue="contact" className="w-full">
                <AccordionItem value="contact" className="border-none bg-white/80 rounded-[2rem] border-2 border-border border-dashed px-4 shadow-sm">
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-9 h-9 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground leading-none mb-1">Contact Details</p>
                        <p className="text-sm font-bold leading-none">
                          {formData.name || "Enter Name"} • {formData.phone || "Enter Phone"}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 pt-1">
                    <div className="space-y-3">
                      <div className="relative group">
                        <Input
                          placeholder="Your Full Name"
                          className="bg-transparent h-11 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="relative group">
                        <Input
                          placeholder="M-Pesa Number (07XX XXX XXX)"
                          className="bg-transparent h-11 rounded-xl border-border focus:ring-primary/20 shadow-none text-sm"
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground italic leading-tight px-1">
                        We'll use this to send your order summary and confirm payment via WhatsApp.
                      </p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </motion.div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-card rounded-2xl p-5 mb-8 border border-border shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground text-sm">Subtotal</span>
            <span className="font-semibold">KES {totalAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center px-1">
            <span className="text-muted-foreground text-[10px] uppercase font-black tracking-widest">Delivery Fee</span>
            <div className="text-right">
              <span className="text-sm font-bold text-primary transition-all">
                {calculatingFee ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : deliveryMethod === 'door' ? (
                  <span className="text-muted-foreground italic text-[10px]">Uber/Bolt Rates</span>
                ) : selectedLocation ? (
                  `KES ${deliveryFeeMin.toLocaleString()} - ${deliveryFeeMax.toLocaleString()}`
                ) : (
                  "Select Agent"
                )}
              </span>
              {deliveryMethod === 'pickup' && selectedLocation && !calculatingFee && (
                <p className="text-[8px] text-muted-foreground uppercase tracking-tighter opacity-70">Joggers Hub → {selectedLocation.area}</p>
              )}
            </div>
          </div>
          <div className="border-t-2 border-dashed border-muted pt-3 mt-1 flex justify-between items-center px-1">
            <span className="font-black text-xs uppercase tracking-widest text-muted-foreground">Est. Total</span>
            <div className="text-right">
              <span className="font-black text-2xl sm:text-3xl text-primary drop-shadow-sm tracking-tight">
                {deliveryMethod === 'door' ? (
                  `KES ${totalAmount.toLocaleString()} + Fees`
                ) : (
                  `KES ${estimatedTotalMin.toLocaleString()} - ${estimatedTotalMax.toLocaleString()}`
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Main CTA */}
        <Button
          onClick={handleSendOrder}
          size="lg"
          className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-base font-bold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:scale-95"
          disabled={loading || (deliveryMethod === 'pickup' && !selectedLocation)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <MessageCircle className="ml-2 h-5 w-5" />
              {deliveryMethod === 'door' ? 'Send for Courier Rates' : 'Send Order via WhatsApp'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
        <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
          Confirm exactly how much to pay via WhatsApp
        </p>
      </div>
    </div>
  )
}

export default function CartPage() {
  return (
    <Suspense fallback={
      <div className="py-24 px-4 text-center">
        <div className="container mx-auto max-w-md space-y-4">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground font-medium tracking-tight animate-pulse">Syncing with Pickup Mtaani...</p>
        </div>
      </div>
    }>
      <CartContent />
    </Suspense>
  )
}
