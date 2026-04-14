import { getStripe } from "./client";

interface CreateCheckoutParams {
  priceId: string;
  productName: string;
  courseId: string;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession({
  priceId,
  productName,
  courseId,
  customerEmail,
  successUrl,
  cancelUrl,
}: CreateCheckoutParams) {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      course_id: courseId,
      product_name: productName,
    },
    ...(customerEmail ? { customer_email: customerEmail } : {}),
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return session;
}
