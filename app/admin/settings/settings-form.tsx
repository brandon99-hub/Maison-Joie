"use client"

import React, { useState } from "react"
import { Loader2, Mail, Lock, Save, CheckCircle, Percent, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { updateAdminEmail, updateAdminPassword, updateDiscountSetting } from "./actions"

interface SettingsFormProps {
    currentEmail: string
    currentDiscount: number
}

export function SettingsForm({ currentEmail, currentDiscount }: SettingsFormProps) {
    const [loading, setLoading] = useState(false)
    const [loadingPassword, setLoadingPassword] = useState(false)
    const [loadingDiscount, setLoadingDiscount] = useState(false)

    const [email, setEmail] = useState(currentEmail)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [discountPercent, setDiscountPercent] = useState(currentDiscount)

    const [emailSuccess, setEmailSuccess] = useState(false)
    const [passwordSuccess, setPasswordSuccess] = useState(false)
    const [discountSuccess, setDiscountSuccess] = useState(false)
    const [emailError, setEmailError] = useState("")
    const [passwordError, setPasswordError] = useState("")
    const [discountError, setDiscountError] = useState("")

    const handleEmailUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setEmailError("")
        setEmailSuccess(false)

        const result = await updateAdminEmail(email)

        if (result.success) {
            setEmailSuccess(true)
            setTimeout(() => setEmailSuccess(false), 3000)
        } else {
            setEmailError(result.error || "Failed to update email")
        }
        setLoading(false)
    }

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingPassword(true)
        setPasswordError("")
        setPasswordSuccess(false)

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match")
            setLoadingPassword(false)
            return
        }

        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters")
            setLoadingPassword(false)
            return
        }

        const result = await updateAdminPassword(currentPassword, newPassword)

        if (result.success) {
            setPasswordSuccess(true)
            setCurrentPassword("")
            setNewPassword("")
            setConfirmPassword("")
            setTimeout(() => setPasswordSuccess(false), 3000)
        } else {
            setPasswordError(result.error || "Failed to update password")
        }
        setLoadingPassword(false)
    }

    const handleDiscountUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoadingDiscount(true)
        setDiscountError("")
        setDiscountSuccess(false)

        const result = await updateDiscountSetting(discountPercent)

        if (result.success) {
            setDiscountSuccess(true)
            setTimeout(() => setDiscountSuccess(false), 3000)
        } else {
            setDiscountError(result.error || "Failed to update discount")
        }
        setLoadingDiscount(false)
    }

    // Calculate example prices for preview
    const examplePrice = 1000
    const discountedPrice = Math.round(examplePrice * (1 - discountPercent / 100))

    return (
        <div className="p-6 md:p-8 max-w-4xl">
            <AdminPageHeader
                title="Settings"
                description="Manage your notification email, security credentials, and store promotions."
            />

            <div className="grid gap-6">
                {/* Email Settings */}
                <div className="bg-card rounded-xl border border-border/70 p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Email Address</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        This email will be used for admin notifications and password reset requests.
                    </p>
                    <form onSubmit={handleEmailUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="admin@maisonjoie.co.ke"
                                required
                                className="mt-2"
                                disabled={loading}
                            />
                        </div>
                        {emailError && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {emailError}
                            </div>
                        )}
                        {emailSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Email updated successfully!
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[44px]"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Email
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Password Settings */}
                <div className="bg-card rounded-xl border border-border/70 p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Lock className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Update your admin password. Minimum 8 characters required.
                    </p>
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                required
                                className="mt-2"
                                disabled={loadingPassword}
                            />
                        </div>
                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                                minLength={8}
                                className="mt-2"
                                disabled={loadingPassword}
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                                minLength={8}
                                className="mt-2"
                                disabled={loadingPassword}
                            />
                        </div>
                        {passwordError && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {passwordError}
                            </div>
                        )}
                        {passwordSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Password updated successfully!
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[44px]"
                            disabled={loadingPassword}
                        >
                            {loadingPassword ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Lock className="w-4 h-4 mr-2" />
                                    Update Password
                                </>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Secret Menu Discount Settings */}
                <div className="bg-gradient-to-br from-rose-50/50 to-amber-50/30 dark:from-rose-950/20 dark:to-amber-950/10 rounded-xl border border-rose-200/60 dark:border-rose-900/40 p-6 shadow-xs">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">Secret Menu Discount</h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        Set the discount percentage for secret QR code rewards. This applies to all new secret codes generated when orders are marked as paid.
                    </p>
                    <form onSubmit={handleDiscountUpdate} className="space-y-4">
                        <div>
                            <Label htmlFor="discount">Discount Percentage</Label>
                            <div className="relative mt-2">
                                <Input
                                    id="discount"
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={discountPercent}
                                    onChange={(e) => setDiscountPercent(parseInt(e.target.value) || 10)}
                                    className="pr-10"
                                    disabled={loadingDiscount}
                                />
                                <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Live Preview */}
                        <div className="bg-background/80 backdrop-blur rounded-lg p-4 border border-rose-200/50 dark:border-rose-900/30">
                            <p className="text-xs text-muted-foreground mb-2">Live Customer Preview:</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-primary font-bold text-lg">
                                    KES {discountedPrice.toLocaleString()}
                                </span>
                                <span className="text-muted-foreground text-sm line-through">
                                    KES {examplePrice.toLocaleString()}
                                </span>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                    {discountPercent}% OFF
                                </span>
                            </div>
                        </div>

                        {discountError && (
                            <div className="flex items-center gap-2 text-destructive text-sm">
                                <AlertCircle className="w-4 h-4" />
                                {discountError}
                            </div>
                        )}
                        {discountSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                                <CheckCircle className="w-4 h-4" />
                                Discount updated successfully!
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-h-[44px]"
                            disabled={loadingDiscount}
                        >
                            {loadingDiscount ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save Discount
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default SettingsForm
