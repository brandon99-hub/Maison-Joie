"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Clock, CheckCircle, Package, MapPin, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Order } from "@/lib/db"

const statusSteps = [
  { key: "pending", label: "Pending Verification", icon: Clock },
  { key: "paid", label: "Payment Confirmed", icon: CheckCircle },
  { key: "packed", label: "Being Packed", icon: Package },
  { key: "collected", label: "Collected", icon: MapPin },
]

export function OrderStatus({ order }: { order: Order }) {
  const router = useRouter()
  const [checking, setChecking] = useState(false)

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status)

  // Poll for payment confirmation
  useEffect(() => {
    if (order.status === "pending") {
      const interval = setInterval(() => {
        setChecking(true)
        router.refresh()
        setTimeout(() => setChecking(false), 1000)
      }, 10000) // Check every 10 seconds

      return () => clearInterval(interval)
    }
  }, [order.status, router])

  // Redirect to success when payment confirmed
  useEffect(() => {
    if (order.mpesa_confirmed) {
      router.push(`/success/${order.reference_code}`)
    }
  }, [order.mpesa_confirmed, order.reference_code, router])

  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-lg">
        <div className="text-center mb-8">
          <span className="inline-block bg-muted text-muted-foreground text-sm px-3 py-1 rounded-full mb-4">
            Order #{order.reference_code}
          </span>
          <h1 className="text-2xl font-bold mb-2">
            {order.status === "pending" ? "Waiting for Payment" : "Order Status"}
          </h1>
          {order.status === "pending" && (
            <p className="text-muted-foreground">
              We're checking for your MPESA payment
              {checking && <span className="animate-pulse">...</span>}
            </p>
          )}
        </div>

        {/* Status Timeline */}
        <div className="space-y-4 mb-8">
          {statusSteps.map((step, i) => {
            const Icon = step.icon
            const isActive = i <= currentStepIndex
            const isCurrent = i === currentStepIndex

            return (
              <motion.div
                key={step.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  isCurrent ? "bg-primary/10 border border-primary/20" : isActive ? "bg-muted" : "bg-muted/50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className={`font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </p>
                  {isCurrent && order.status === "pending" && (
                    <p className="text-sm text-muted-foreground">Usually takes 2-5 minutes</p>
                  )}
                </div>
                {isCurrent && (
                  <div className="ml-auto">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                    </span>
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* Order Details */}
        <div className="bg-muted rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span>{order.customer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Phone</span>
              <span>{order.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pickup</span>
              <span>{order.pickup_location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span className="font-semibold">KES {order.total_amount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <Button asChild variant="outline" className="w-full bg-transparent">
            <Link href="/shop">
              Continue Shopping <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
