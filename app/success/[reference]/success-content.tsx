"use client"

import { useState } from "react"
import Link from "next/link"
import { Copy, Check, MessageCircle, ShoppingBag, Sparkles, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AccountCreationPrompt } from "@/components/account-creation-prompt"
import { motion } from "framer-motion"
import { WHATSAPP_NUMBER } from "@/lib/whatsapp"

const MPESA_PHONE = WHATSAPP_NUMBER
const MPESA_BUSINESS_NAME = process.env.NEXT_PUBLIC_MPESA_BUSINESS_NAME

type SuccessContentProps = {
  reference: string
  isSecretPurchase: boolean
}

export function SuccessContent({ reference, isSecretPurchase }: SuccessContentProps) {
  const [copiedPhone, setCopiedPhone] = useState(false)
  const [copiedRef, setCopiedRef] = useState(false)

  const copyToClipboard = (text: string, type: "phone" | "ref") => {
    navigator.clipboard.writeText(text)
    if (type === "phone") {
      setCopiedPhone(true)
      setTimeout(() => setCopiedPhone(false), 2000)
    } else {
      setCopiedRef(true)
      setTimeout(() => setCopiedRef(false), 2000)
    }
  }

  const openWhatsApp = () => {
    const message = `Hi Maison Joie! 👋\\n\\nI'd like to place this order:\\n\\n📦 ORDER ${reference}\\n\\nPlease confirm my exact total and send payment details! 🙏`
    window.open(`https://wa.me/${MPESA_PHONE}?text=${encodeURIComponent(message)}`, "_blank")
  }

  // Premium Secret Purchase UI
  if (isSecretPurchase) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 py-8 px-4 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 20, repeat: Infinity }}
            className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              rotate: [0, -90, 0],
              opacity: [0.1, 0.15, 0.1],
            }}
            transition={{ duration: 25, repeat: Infinity }}
            className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-3xl"
          />
        </div>

        <div className="container mx-auto max-w-2xl relative z-10">
          {/* Secret VIP Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-20 h-20 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-pink-500/50"
            >
              <Sparkles className="h-10 w-10 text-white" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-block bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-3"
            >
              ㊙️ Secret VIP Purchase
            </motion.div>
            <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              Exclusive Order Sent!
            </h1>
            <p className="text-muted-foreground italic">
              Your secret reference: <span className="font-mono font-bold text-foreground">{reference}</span>
            </p>
          </motion.div>

          {/* Account Creation Prompt */}
          <AccountCreationPrompt referenceCode={reference} />

          {/* Premium Payment Instructions Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-6 bg-white/80 backdrop-blur-xl border-2 border-pink-200 shadow-2xl shadow-pink-500/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gift className="h-5 w-5 text-pink-500" />
                  ⏳ Awaiting Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">1. Send payment via MPESA to:</p>
                  <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-200">
                    <div>
                      <p className="font-bold text-lg">{MPESA_PHONE}</p>
                      {MPESA_BUSINESS_NAME && <p className="text-sm text-muted-foreground">{MPESA_BUSINESS_NAME}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(MPESA_PHONE, "phone")}
                      className="border-pink-300 hover:bg-pink-50"
                    >
                      {copiedPhone ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">2. Use this reference code:</p>
                  <div className="flex items-center justify-between bg-gradient-to-r from-pink-50 to-purple-50 p-3 rounded-lg border border-pink-200">
                    <p className="font-mono font-bold text-lg">{reference}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(reference, "ref")}
                      className="border-pink-300 hover:bg-pink-50"
                    >
                      {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Alert className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
                  <AlertDescription className="text-sm font-medium text-pink-900">
                    🎉 You've unlocked exclusive secret pricing! We'll send you the exact total via WhatsApp within 5-10 minutes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </motion.div>

          {/* Backup WhatsApp Link */}
          <div className="text-center mb-8">
            <button
              onClick={openWhatsApp}
              className="text-xs font-bold text-green-600 hover:text-green-700 underline flex items-center justify-center gap-1.5 mx-auto"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Didn't open WhatsApp? Tap here to try again
            </button>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
          >
            <Button variant="outline" asChild className="w-full rounded-xl border-pink-300 hover:bg-pink-50">
              <Link href="/shop">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button variant="outline" asChild className="w-full rounded-xl border-pink-300 hover:bg-pink-50">
              <Link href="/">Back to Home</Link>
            </Button>
          </motion.div>

          {/* Next Steps Guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="border-2 border-pink-200 shadow-lg bg-white/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">What Happens Next?</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm space-y-4 text-muted-foreground font-medium">
                  <li className="flex gap-4">
                    <span className="bg-gradient-to-br from-rose-500 to-pink-500 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">1</span>
                    <span>We've sent your order summary to WhatsApp. Please **wait for us to reply** with your exact total.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-gradient-to-br from-rose-500 to-pink-500 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">2</span>
                    <span>Once confirmed, send the payment using the **M-Pesa details** shown above.</span>
                  </li>
                  <li className="flex gap-4">
                    <span className="bg-gradient-to-br from-rose-500 to-pink-500 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white shrink-0">3</span>
                    <span>After payment, we'll verify and coordinate your **delivery timing**! 💄✨</span>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    )
  }

  // Standard Success Page UI
  return (
    <div className="py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Order Sent!</h1>
          <p className="text-muted-foreground italic">Your reference code is: <span className="font-mono font-bold text-foreground">{reference}</span></p>
        </div>

        {/* Account Creation Prompt */}
        <AccountCreationPrompt referenceCode={reference} />

        {/* Payment Instructions Card */}
        <Card className="mb-6 bg-blue-50/50 border-blue-100 border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">⏳ Awaiting Confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">1. Send payment via MPESA to:</p>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                <div>
                  <p className="font-bold text-lg">{MPESA_PHONE}</p>
                  {MPESA_BUSINESS_NAME && <p className="text-sm text-muted-foreground">{MPESA_BUSINESS_NAME}</p>}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(MPESA_PHONE, "phone")}
                >
                  {copiedPhone ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">2. Use this reference code:</p>
              <div className="flex items-center justify-between bg-white p-3 rounded-lg">
                <p className="font-mono font-bold text-lg">{reference}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(reference, "ref")}
                >
                  {copiedRef ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert className="bg-white border-blue-200">
              <AlertDescription className="text-sm font-medium text-blue-800">
                We'll send you the exact total via WhatsApp within 5-10 minutes. Once confirmed, you can proceed with the M-Pesa payment below.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Backup WhatsApp Link */}
        <div className="text-center mb-8">
          <button
            onClick={openWhatsApp}
            className="text-xs font-bold text-green-600 hover:text-green-700 underline flex items-center justify-center gap-1.5 mx-auto"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Didn't open WhatsApp? Tap here to try again
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button variant="outline" asChild className="w-full rounded-xl">
            <Link href="/shop">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Continue Shopping
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full rounded-xl">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        {/* Next Steps Guide */}
        <Card className="border border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="text-sm space-y-4 text-muted-foreground font-medium">
              <li className="flex gap-4">
                <span className="bg-primary/10 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary shrink-0">1</span>
                <span>We've sent your order summary to WhatsApp. Please **wait for us to reply** with your exact total.</span>
              </li>
              <li className="flex gap-4">
                <span className="bg-primary/10 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary shrink-0">2</span>
                <span>Once confirmed, send the payment using the **M-Pesa details** shown above.</span>
              </li>
              <li className="flex gap-4">
                <span className="bg-primary/10 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-primary shrink-0">3</span>
                <span>After payment, we'll verify and coordinate your **delivery timing**! 💄✨</span>
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
