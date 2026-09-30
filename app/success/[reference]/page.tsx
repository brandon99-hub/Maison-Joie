import { notFound } from "next/navigation"
import { sql, type Order } from "@/lib/db"
import { SuccessContent } from "./success-content"

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ reference: string }>
}) {
  const { reference } = await params

  const orders = (await sql`
    SELECT * FROM orders
    WHERE reference_code = ${reference}
  `) as Order[]

  if (!orders.length) {
    notFound()
  }

  const order = orders[0]
  const isSecretPurchase = !!order.secret_code

  return <SuccessContent reference={reference} isSecretPurchase={isSecretPurchase} />
}
