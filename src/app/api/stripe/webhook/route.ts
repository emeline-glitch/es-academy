import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/client";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const email = session.customer_details?.email || session.customer_email;
    const courseId = session.metadata?.course_id;
    const productName = session.metadata?.product_name;
    const amountPaid = session.amount_total || 0;

    if (!email || !courseId) {
      console.error("Missing email or courseId in session:", session.id);
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    try {
      const supabase = await createServiceClient();

      // Find or note user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === email);

      let userId: string;

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create an invited user (they'll set password on first login)
        const { data: newUser, error: createError } =
          await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: session.customer_details?.name || "" },
          });

        if (createError || !newUser?.user) {
          console.error("Failed to create user:", createError);
          return NextResponse.json({ error: "User creation failed" }, { status: 500 });
        }

        userId = newUser.user.id;
      }

      // Insert enrollment
      const { error: enrollError } = await supabase.from("enrollments").upsert(
        {
          user_id: userId,
          course_id: courseId,
          product_name: productName,
          stripe_session_id: session.id,
          stripe_customer_id: session.customer as string,
          amount_paid: amountPaid,
        },
        { onConflict: "user_id,course_id" }
      );

      if (enrollError) {
        console.error("Enrollment insert error:", enrollError);
      }

      // Add to contacts table
      const { error: contactError } = await supabase.from("contacts").upsert(
        {
          email,
          first_name: session.customer_details?.name?.split(" ")[0] || "",
          last_name: session.customer_details?.name?.split(" ").slice(1).join(" ") || "",
          tags: ["client", productName || "formation"],
          source: "stripe",
          status: "active",
        },
        { onConflict: "email" }
      );

      if (contactError) {
        console.error("Contact insert error:", contactError);
      }
    } catch (err) {
      console.error("Webhook processing error:", err);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
