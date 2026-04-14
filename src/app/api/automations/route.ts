import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses/client";

// This endpoint is called by a cron job (Vercel Cron or external)
// It processes pending automation steps for all contacts
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.REVALIDATION_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  // Get all active sequences
  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("*")
    .eq("status", "active");

  if (!sequences || sequences.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;

  for (const sequence of sequences) {
    const steps = sequence.steps as Array<{
      delay_days: number;
      subject: string;
      html_content: string;
    }>;

    // Find contacts that triggered this sequence
    // For each contact, check which step they're on and if it's time to send
    const { data: sends } = await supabase
      .from("email_sends")
      .select("contact_id, campaign_id")
      .eq("campaign_id", `seq_${sequence.id}`)
      .order("sent_at", { ascending: false });

    // Get contacts matching the trigger
    let contactsQuery = supabase.from("contacts").select("*").eq("status", "active");

    if (sequence.trigger_event === "purchase") {
      contactsQuery = contactsQuery.contains("tags", ["client"]);
    } else if (sequence.trigger_event === "signup") {
      contactsQuery = contactsQuery.contains("tags", ["newsletter"]);
    }

    const { data: contacts } = await contactsQuery;
    if (!contacts) continue;

    for (const contact of contacts) {
      // Determine which step this contact is on
      const contactSends = sends?.filter((s) => s.contact_id === contact.id) || [];
      const currentStep = contactSends.length;

      if (currentStep >= steps.length) continue; // All steps done

      const step = steps[currentStep];
      const contactDate = new Date(contact.subscribed_at || contact.created_at);
      const sendDate = new Date(contactDate.getTime() + step.delay_days * 86400000);

      if (new Date() >= sendDate) {
        // Time to send this step
        await sendEmail({
          to: contact.email,
          subject: step.subject,
          html: step.html_content,
        });

        await supabase.from("email_sends").insert({
          campaign_id: `seq_${sequence.id}`,
          contact_id: contact.id,
          status: "sent",
          sent_at: new Date().toISOString(),
        });

        processed++;
      }
    }
  }

  return NextResponse.json({ processed });
}
