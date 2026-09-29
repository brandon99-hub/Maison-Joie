import { notFound, redirect } from "next/navigation"
import { sql, type Order } from "@/lib/db"
import { OrderStatus } from "./order-status"

export default async function OrderPage({
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

  // If payment confirmed, redirect to success
  if (order.mpesa_confirmed) {
    redirect(`/success/${reference}`)
  }

  return <OrderStatus order={order} />
}
