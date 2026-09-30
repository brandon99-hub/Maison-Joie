"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { UserPlus, Loader2, X, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createAccountFromOrder } from "@/app/(auth)/actions"
import { toast } from "sonner"

type AccountCreationPromptProps = {
    referenceCode: string
    orderEmail?: string
}

export function AccountCreationPrompt({ referenceCode, orderEmail }: AccountCreationPromptProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [dismissed, setDismissed] = useState(false)
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState(orderEmail || "")
    const [password, setPassword] = useState("")
    const [name, setName] = useState("")

    // Don't show if already logged in or dismissed
    if (session?.user || dismissed) {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const result = await createAccountFromOrder({
            email,
            password,
            referenceCode,
            name,
        })

        if (result.success) {
            toast.success("Account created! Redirecting to dashboard...")
            setTimeout(() => {
                router.push("/dashboard")
                router.refresh()
            }, 1500)
        } else {
            toast.error(result.error || "Failed to create account")
            setLoading(false)
        }
    }

    return (
        <Card id="account-creation-section" className="mb-6 bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-200 relative overflow-hidden scroll-mt-8">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-rose-200/30 to-amber-200/30 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/30 to-rose-200/30 rounded-full -ml-12 -mb-12" />

            <button
                onClick={() => setDismissed(true)}
                className="absolute top-3 right-3 p-1 hover:bg-black/5 rounded-full transition-colors z-10"
            >
                <X className="w-4 h-4" />
            </button>

            <CardHeader className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <UserPlus className="w-6 h-6 text-rose-600" />
                    <CardTitle className="text-xl bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">
                        Track Your Order & Save Time Next Visit!
                    </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground">
                    Create your account below to link this order and track it in real-time.
                </p>
            </CardHeader>

            <CardContent className="relative">
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium mb-2">Account Benefits:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            Track this order in real-time
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            Reorder with one click
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            Save addresses for faster checkout
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            Get personalized recommendations
                        </li>
                    </ul>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <Label htmlFor="name" className="text-sm">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Your name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="mt-1 h-10 bg-white"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Label htmlFor="email" className="text-sm">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-1 h-10 bg-white"
                            disabled={loading}
                        />
                    </div>

                    <div>
                        <Label htmlFor="password" className="text-sm">Create Password</Label>
                        <PasswordInput
                            id="password"
                            placeholder="Min. 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                            className="mt-1 h-10 bg-white"
                            disabled={loading}
                            showStrength
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-10 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Account & Track Order
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        This order will be automatically linked to your account
                    </p>
                </form>
            </CardContent>
        </Card>
    )
}
