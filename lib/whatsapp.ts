// WhatsApp notification helper
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER!

export function notifyOwnerNewOrder(order: {
    referenceCode: string
    customerName: string
    phoneNumber: string
    totalAmount: number
    deliveryMethod?: string
    pickupLocation: string
}) {
    const ownerPhone = WHATSAPP_NUMBER

    const deliveryMethodLabel = order.deliveryMethod === "pickup-mtaani"
        ? "Pickup Mtaani"
        : order.deliveryMethod === "door-to-door"
            ? "Door to Door"
            : "Self Pickup";

    const message = `🛍️ NEW ORDER!

Ref: ${order.referenceCode}
Customer: ${order.customerName}
Phone: ${order.phoneNumber}
Amount: KES ${order.totalAmount.toLocaleString()}
Delivery: ${deliveryMethodLabel}
Location: ${order.pickupLocation}

Check admin panel to confirm payment.`

    // Auto-open WhatsApp with pre-filled message
    if (typeof window !== "undefined") {
        window.open(`https://wa.me/${ownerPhone}?text=${encodeURIComponent(message)}`, "_blank")
    }
}
