"use client"

import { useState, type ComponentProps, type ChangeEvent } from "react"
import { Eye, EyeOff, Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { getPasswordStrength, passwordRequirements } from "@/lib/password-strength"

type PasswordInputProps = Omit<ComponentProps<typeof Input>, "type"> & {
    showStrength?: boolean
}

export function PasswordInput({ showStrength = false, className, value, onChange, ...props }: PasswordInputProps) {
    const [visible, setVisible] = useState(false)
    const [internalValue, setInternalValue] = useState("")
    const password = typeof value === "string" ? value : internalValue

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        onChange?.(e)
        if (value === undefined) setInternalValue(e.target.value)
    }

    const strength = showStrength ? getPasswordStrength(password) : null
    const requirements = showStrength ? passwordRequirements(password) : []

    return (
        <div>
            <div className="relative">
                <Input
                    type={visible ? "text" : "password"}
                    className={cn("pr-10", className)}
                    value={value}
                    onChange={handleChange}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                    {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
            </div>

            {showStrength && password && strength && (
                <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-1 flex-1 rounded-full transition-colors"
                                style={{ backgroundColor: i <= strength.score - 1 ? strength.color : "#e5e7eb" }}
                            />
                        ))}
                    </div>
                    <p className="text-xs font-medium" style={{ color: strength.color }}>
                        {strength.label}
                    </p>
                    <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {requirements.map((req) => (
                            <li key={req.label} className="flex items-center gap-1 text-xs text-muted-foreground">
                                {req.met ? (
                                    <Check className="w-3 h-3 text-green-600 shrink-0" />
                                ) : (
                                    <X className="w-3 h-3 text-gray-300 shrink-0" />
                                )}
                                <span className={req.met ? "text-green-700" : ""}>{req.label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
