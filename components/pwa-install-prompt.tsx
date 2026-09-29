"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e)

            // Check if user has dismissed before
            const dismissed = localStorage.getItem("pwa-install-dismissed")
            if (!dismissed) {
                setShowPrompt(true)
            }
        }

        window.addEventListener("beforeinstallprompt", handler)

        return () => window.removeEventListener("beforeinstallprompt", handler)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return

        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice

        if (outcome === "accepted") {
            setShowPrompt(false)
        }

        setDeferredPrompt(null)
    }

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem("pwa-install-dismissed", "true")
    }

    if (!showPrompt) return null

    return (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-card border border-border rounded-xl shadow-lg p-4 z-50 animate-in slide-in-from-bottom">
            <button
                onClick={handleDismiss}
                className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
            >
                <X className="h-4 w-4" />
            </button>

            <div className="pr-6">
                <h3 className="font-semibold mb-1">Install Maison Joie</h3>
                <p className="text-sm text-muted-foreground mb-4">
                    Add to your home screen for quick access and offline browsing
                </p>
                <Button onClick={handleInstall} className="w-full">
                    Install App
                </Button>
            </div>
        </div>
    )
}
