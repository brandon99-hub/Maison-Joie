"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestCustomerPasswordReset } from "../actions"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccessMessage("")

        const result = await requestCustomerPasswordReset(email)

        if (result.success) {
            setSuccessMessage(result.message || "Password reset instructions have been sent to your email.")
        } else {
            setError(result.error || "Failed to process request. Please try again.")
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-rose-50 via-pink-50 to-white">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="w-52 h-14 mx-auto mb-4 relative">
                        <Image
                            src="/logo2.png"
                            alt="Maison Joie"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Reset Password
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Enter your email and we'll send you instructions to reset your password.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
                    {successMessage ? (
                        <div className="space-y-6 text-center">
                            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-foreground">Check Your Email</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {successMessage}
                                </p>
                            </div>
                            <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Link href="/login">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Return to Sign In
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <Label htmlFor="email">Account Email</Label>
                                <div className="relative mt-2">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="pl-10 h-11"
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-800">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-medium"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending Instructions...
                                    </>
                                ) : (
                                    "Send Reset Instructions"
                                )}
                            </Button>

                            <div className="text-center pt-2">
                                <Link
                                    href="/login"
                                    className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
