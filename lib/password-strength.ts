export type PasswordStrength = {
    score: 0 | 1 | 2 | 3 | 4
    label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong"
    color: string
}

const LABELS: PasswordStrength["label"][] = ["Very weak", "Weak", "Fair", "Good", "Strong"]
const COLORS = ["#ef4444", "#f97316", "#eab308", "#84cc16", "#22c55e"]

export function getPasswordStrength(password: string): PasswordStrength {
    if (!password) {
        return { score: 0, label: LABELS[0], color: COLORS[0] }
    }

    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[^a-zA-Z0-9]/.test(password)) score++

    const clamped = Math.min(score, 4) as PasswordStrength["score"]
    return { score: clamped, label: LABELS[clamped], color: COLORS[clamped] }
}

export function passwordRequirements(password: string) {
    return [
        { label: "At least 8 characters", met: password.length >= 8 },
        { label: "One lowercase letter", met: /[a-z]/.test(password) },
        { label: "One uppercase letter", met: /[A-Z]/.test(password) },
        { label: "One number", met: /[0-9]/.test(password) },
    ]
}
