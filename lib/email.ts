import nodemailer from "nodemailer"
import type { CartItem } from "./db"

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maison-joie.vercel.app"
  const resetUrl = `${baseUrl}/admin/reset-password/${token}`

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Maison Joie Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Password - Maison Joie Admin",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>We received a request to reset your password for your Maison Joie admin account.</p>
              <p>Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px; font-size: 12px;">
                ${resetUrl}
              </p>
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul style="margin: 10px 0;">
                  <li>This link expires in <strong>1 hour</strong></li>
                  <li>If you didn't request this, please ignore this email</li>
                  <li>Your password won't change until you create a new one</li>
                </ul>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Maison Joie. All rights reserved.</p>
              <p>This is an automated email, please do not reply.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendAbandonedCartEmail(email: string, customerName: string, items: CartItem[]) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maison-joie.vercel.app"
  const cartUrl = `${baseUrl}/cart`
  const itemsHtml = items.map(item => `
    <div style="display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #eee;">
      <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; border-radius: 4px; object-cover: cover; margin-right: 15px;">
      <div style="flex: 1;">
        <p style="margin: 0; font-weight: bold; font-size: 14px;">${item.name}</p>
        <p style="margin: 0; color: #666; font-size: 12px;">Qty: ${item.quantity} • KES ${item.price.toLocaleString()}</p>
      </div>
    </div>
  `).join('')

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Maison Joie" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Still thinking about it? Your cart is waiting! ✨",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
            .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #f1f5f9; border-top: none; }
            .hero-text { font-size: 18px; color: #1e293b; font-weight: bold; margin-bottom: 20px; }
            .button { display: inline-block; padding: 14px 35px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 30px 0; box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.2); }
            .footer { text-align: center; margin-top: 30px; font-size: 13px; color: #94a3b8; }
            .cart-summary { background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .heart { color: #f43f5e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Maison Joie</h1>
            </div>
            <div class="content">
              <p class="hero-text">Hi ${customerName || 'Gorgeous'},</p>
              <p>We noticed you left some beautiful items in your cart. They're still here, but they miss you! <span class="heart">♥</span></p>
              
              <div class="cart-summary">
                <p style="margin-top: 0; font-weight: bold; font-size: 14px; text-transform: uppercase; color: #64748b;">Items in your cart:</p>
                ${itemsHtml}
              </div>

              <p>Ready to complete your collection? These items might sell out soon!</p>
              
              <p style="text-align: center;">
                <a href="${cartUrl}" class="button">Complete My Order</a>
              </p>

              <p style="font-size: 14px; color: #64748b; font-style: italic;">
                Need help with your order? Just reply to this email or message us on WhatsApp!
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Maison Joie. Based in Kenya 🇰🇪</p>
              <p>Stay Fabulous! ✨</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending abandoned cart email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendBackInStockEmail(
  email: string,
  productName: string,
  productSlug: string,
  productImage?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maison-joie.vercel.app"
  const productUrl = `${baseUrl}/product/${productSlug}`

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Maison Joie" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🎉 ${productName} is Back in Stock!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 40px 20px; text-align: center; border-radius: 12px 12px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; letter-spacing: -0.5px; }
            .content { background: #ffffff; padding: 40px 30px; border-radius: 0 0 12px 12px; border: 1px solid #f1f5f9; border-top: none; }
            .product-card { background: linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center; border: 2px solid #fecdd3; }
            .product-image { max-width: 200px; height: 200px; object-fit: cover; border-radius: 12px; margin: 0 auto 16px; display: block; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
            .product-name { font-size: 24px; font-weight: bold; color: #be123c; margin: 16px 0; }
            .button { display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: white !important; text-decoration: none; border-radius: 12px; font-weight: bold; margin: 24px 0; box-shadow: 0 4px 6px -1px rgba(244, 63, 94, 0.3); font-size: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
            .button:hover { box-shadow: 0 10px 15px -3px rgba(244, 63, 94, 0.4); }
            .urgency { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 8px; }
            .urgency-text { color: #92400e; font-weight: 600; margin: 0; }
            .footer { text-align: center; margin-top: 30px; font-size: 13px; color: #94a3b8; }
            .heart { color: #f43f5e; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ Maison Joie</h1>
            </div>
            <div class="content">
              <p style="font-size: 18px; color: #1e293b; font-weight: bold; margin-bottom: 8px;">Great news!</p>
              <p style="font-size: 16px; color: #475569;">The item you've been waiting for is finally back in stock! <span class="heart">♥</span></p>
              
              <div class="product-card">
                ${productImage ? `<img src="${productImage}" alt="${productName}" class="product-image" />` : ''}
                <p class="product-name">${productName}</p>
                <p style="color: #64748b; font-size: 14px; margin: 0;">Now available for purchase!</p>
              </div>

              <div class="urgency">
                <p class="urgency-text">⚡ Hurry! Popular items sell out fast. Grab yours before it's gone again!</p>
              </div>
              
              <p style="text-align: center;">
                <a href="${productUrl}" class="button">Shop Now</a>
              </p>

              <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 32px;">
                You're receiving this because you joined the waitlist for this product.<br/>
                Questions? Reply to this email or message us on WhatsApp!
              </p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Maison Joie. Based in Kenya 🇰🇪</p>
              <p>Stay Fabulous! ✨</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending back-in-stock email:", error)
    return { success: false, error: "Failed to send email" }
  }
}

export async function sendCustomerPasswordResetEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maison-joie.vercel.app"
  const resetUrl = `${baseUrl}/reset-password/${token}`

  const mailOptions = {
    from: process.env.SMTP_FROM || `"Maison Joie" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset Your Maison Joie Password ✨",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; }
            .container { max-width: 560px; margin: 0 auto; padding: 24px 16px; }
            .card { background: #ffffff; border-radius: 16px; border: 1px solid #fce7f3; overflow: hidden; box-shadow: 0 4px 12px rgba(244, 63, 94, 0.08); }
            .header { background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); padding: 32px 24px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .content { padding: 32px 24px; background: #ffffff; }
            .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: #ffffff !important; text-decoration: none; border-radius: 12px; font-weight: 700; margin: 24px 0; text-align: center; }
            .link-box { word-break: break-all; background: #fdf2f8; padding: 12px; border-radius: 8px; font-size: 12px; color: #be185d; border: 1px solid #fbcfe8; }
            .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #94a3b8; }
            .notice { font-size: 13px; color: #64748b; margin-top: 16px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="header">
                <h1>Maison Joie ✨</h1>
              </div>
              <div class="content">
                <h2 style="font-size: 18px; margin-top: 0; color: #0f172a;">Password Reset Request</h2>
                <p>Hello Gorgeous,</p>
                <p>We received a request to reset the password for your Maison Joie account. Click the button below to choose a new password:</p>
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                <p class="notice">If the button doesn't work, copy and paste this link into your browser:</p>
                <p class="link-box">${resetUrl}</p>
                <p class="notice">⚠️ This secure link will expire in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Maison Joie • Nairobi, Kenya</p>
            </div>
          </div>
        </body>
      </html>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    return { success: true }
  } catch (error) {
    console.error("Error sending customer password reset email:", error)
    return { success: false, error: "Failed to send reset email" }
  }
}

