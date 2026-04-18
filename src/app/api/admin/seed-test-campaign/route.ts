import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Creates a test campaign with fake sends, opens, and clicks for demo purposes
// Call POST /api/admin/seed-test-campaign to populate
export async function POST() {
  // Use pure service role client (bypasses RLS)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  );

  // 1. Create test contacts if they don't exist
  const testContacts = [
    { email: "marie.dupont@test.com", first_name: "Marie", last_name: "Dupont", tags: ["client", "newsletter"], source: "purchase" },
    { email: "jean.martin@test.com", first_name: "Jean", last_name: "Martin", tags: ["prospect", "newsletter"], source: "website" },
    { email: "sophie.bernard@test.com", first_name: "Sophie", last_name: "Bernard", tags: ["ebook", "lead_magnet"], source: "ebook" },
    { email: "lucas.petit@test.com", first_name: "Lucas", last_name: "Petit", tags: ["formation_gratuite"], source: "formation_gratuite" },
    { email: "emma.leroy@test.com", first_name: "Emma", last_name: "Leroy", tags: ["client", "newsletter"], source: "purchase" },
    { email: "thomas.moreau@test.com", first_name: "Thomas", last_name: "Moreau", tags: ["prospect", "newsletter"], source: "website" },
    { email: "camille.simon@test.com", first_name: "Camille", last_name: "Simon", tags: ["ebook", "lead_magnet"], source: "ebook" },
    { email: "hugo.laurent@test.com", first_name: "Hugo", last_name: "Laurent", tags: ["formation_gratuite", "newsletter"], source: "formation_gratuite" },
    { email: "lea.garcia@test.com", first_name: "Léa", last_name: "Garcia", tags: ["client"], source: "purchase" },
    { email: "nathan.roux@test.com", first_name: "Nathan", last_name: "Roux", tags: ["prospect", "ebook"], source: "ebook" },
    { email: "chloe.fournier@test.com", first_name: "Chloé", last_name: "Fournier", tags: ["newsletter"], source: "website" },
    { email: "maxime.girard@test.com", first_name: "Maxime", last_name: "Girard", tags: ["client", "newsletter"], source: "purchase" },
  ];

  const contactIds: string[] = [];
  for (const c of testContacts) {
    const { data } = await supabase
      .from("contacts")
      .upsert({ ...c, status: "active" }, { onConflict: "email" })
      .select("id")
      .single();
    if (data) contactIds.push(data.id);
  }

  // 2. Create a test campaign
  const { data: campaign, error: campError } = await supabase
    .from("email_campaigns")
    .insert({
      subject: "5 erreurs qui ruinent ta rentabilité locative",
      html_content: `
<h2>Bonjour {{prenom}},</h2>
<p>Tu investis dans l'immobilier locatif ? Voici les <strong>5 erreurs les plus courantes</strong> que je vois chez mes élèves :</p>
<ol>
<li>Ne pas calculer le <em>vrai</em> rendement net</li>
<li>Sous-estimer les charges et travaux</li>
<li>Ignorer la fiscalité dès le départ</li>
<li>Ne pas négocier le prix d'achat</li>
<li>Choisir le mauvais régime fiscal</li>
</ol>
<p>J'ai préparé un <strong>guide complet</strong> pour éviter ces pièges :</p>
<p><a href="https://emeline-siron.fr/academy">Découvrir la formation ES Academy →</a></p>
<p>Et si tu veux aller plus loin, teste nos simulateurs gratuits :</p>
<p><a href="https://emeline-siron.fr/simulateurs/rentabilite-locative">Calculer ta rentabilité →</a></p>
<p><a href="https://emeline-siron.fr/simulateurs/capacite-emprunt">Estimer ta capacité d'emprunt →</a></p>
<p>À très vite,<br><strong>Emeline Siron</strong></p>
      `.trim(),
      status: "sent",
      sent_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      sent_count: contactIds.length,
      open_count: 0,
      click_count: 0,
    })
    .select("id")
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: "Erreur création campagne", detail: campError?.message }, { status: 500 });
  }

  // 3. Create send records with realistic tracking data
  const links = [
    "https://emeline-siron.fr/academy",
    "https://emeline-siron.fr/simulateurs/rentabilite-locative",
    "https://emeline-siron.fr/simulateurs/capacite-emprunt",
  ];

  let openCount = 0;
  let clickCount = 0;

  for (let i = 0; i < contactIds.length; i++) {
    const contactId = contactIds[i];

    // Simulate realistic behavior:
    // ~75% open rate, ~35% click rate, some click multiple links
    const didOpen = Math.random() < 0.75;
    const didClick = didOpen && Math.random() < 0.45;
    const numLinksClicked = didClick ? (Math.random() < 0.3 ? 2 : 1) : 0;

    const sentAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + i * 60000); // Staggered sends
    const openedAt = didOpen
      ? new Date(sentAt.getTime() + Math.random() * 24 * 60 * 60 * 1000) // Open within 24h
      : null;
    const clickedAt = didClick && openedAt
      ? new Date(openedAt.getTime() + Math.random() * 30 * 60 * 1000) // Click within 30min of open
      : null;

    // Pick random links
    const clickedLinks: string[] = [];
    if (numLinksClicked > 0) {
      const shuffled = [...links].sort(() => Math.random() - 0.5);
      clickedLinks.push(...shuffled.slice(0, numLinksClicked));
    }

    if (didOpen) openCount++;
    if (didClick) clickCount++;

    await supabase.from("email_sends").insert({
      campaign_id: campaign.id,
      contact_id: contactId,
      status: "sent",
      sent_at: sentAt.toISOString(),
      opened_at: openedAt?.toISOString() || null,
      clicked_at: clickedAt?.toISOString() || null,
      clicked_links: clickedLinks,
    });
  }

  // 4. Update campaign counts
  await supabase
    .from("email_campaigns")
    .update({ open_count: openCount, click_count: clickCount })
    .eq("id", campaign.id);

  return NextResponse.json({
    success: true,
    campaign_id: campaign.id,
    contacts_created: contactIds.length,
    open_count: openCount,
    click_count: clickCount,
    message: `Campagne test créée avec ${contactIds.length} contacts, ${openCount} ouvertures, ${clickCount} clics. Va sur /admin/emails/${campaign.id} pour voir.`,
  });
}
