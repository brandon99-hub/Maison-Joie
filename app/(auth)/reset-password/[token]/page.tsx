"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetCustomerPassword } from "../../actions"

export default function ClientResetPasswordPage() {
    const params = useParams()
    const router = useRouter()
    const token = params.token as string

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            setLoading(false)
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters")
            setLoading(false)
            return
        }

        const result = await resetCustomerPassword(token, password)

        if (result.success) {
            setSuccess(true)
            setTimeout(() => {
                router.push("/login")
            }, 2500)
        } else {
            setError(result.error || "Failed to reset password. The link may have expired.")
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
                        Set New Password
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Create a strong password for your Maison Joie account.
                    </p>
                </div>

                <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
                    {success ? (
                        <div className="space-y-6 text-center">
                            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-foreground">Password Reset Successfully!</h3>
                                <p className="text-sm text-muted-foreground">
                                    Your password has been updated. Redirecting you to sign in...
                                </p>
                            </div>
                            <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground">
                                <Link href="/login">
                                    Sign In Now
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="password">New Password</Label>
                                <div className="relative mt-2">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 8 characters"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                        className="pl-10 pr-10 h-11"
                                        disabled={loading}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative mt-2">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                    <Input
                                        id="confirmPassword"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={8}
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
                                        Updating Password...
                                    </>
                                ) : (
                                    "Save New Password"
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
