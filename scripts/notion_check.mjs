const dbs = {
  Courses: process.env.NOTION_COURSES_DB,
  Modules: process.env.NOTION_MODULES_DB,
  Lessons: process.env.NOTION_LESSONS_DB,
  Resources: process.env.NOTION_RESOURCES_DB,
  Quizzes: process.env.NOTION_QUIZZES_DB,
};

async function fetchDb(id) {
  const res = await fetch(`https://api.notion.com/v1/databases/${id}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100 }),
  });
  if (!res.ok) return { error: `${res.status} ${res.statusText}`, body: await res.text() };
  return await res.json();
}

for (const [name, id] of Object.entries(dbs)) {
  if (!id) { console.log(`[${name}] MISSING ENV`); continue; }
  const r = await fetchDb(id);
  if (r.error) {
    console.log(`[${name}] ERROR: ${r.error}`);
    console.log(`         body: ${r.body.slice(0, 200)}`);
    continue;
  }
  const count = r.results?.length || 0;
  const props = r.results?.[0]?.properties ? Object.keys(r.results[0].properties) : [];
  console.log(`[${name}] ${count} entries${props.length ? " | props: " + props.join(", ") : ""}`);
  if (name === "Lessons" && count > 0) {
    let withVideo = 0;
    for (const p of r.results) {
      const vid = p.properties?.videoId?.rich_text?.[0]?.plain_text || p.properties?.["Video ID"]?.rich_text?.[0]?.plain_text;
      if (vid) withVideo++;
    }
    console.log(`         lessons with videoId: ${withVideo}/${count}`);
  }
  if (name === "Modules" && count > 0) {
    const rows = r.results.map(p => ({
      order: p.properties?.Order?.number ?? 999,
      name: p.properties?.Name?.title?.[0]?.plain_text || "(sans nom)",
      slug: p.properties?.Slug?.rich_text?.[0]?.plain_text || "",
      published: p.properties?.Published?.checkbox || false,
    })).sort((a,b) => a.order - b.order);
    for (const r of rows) console.log(`   #${String(r.order).padStart(2)}  ${r.published?"✅":"⬜️"}  ${r.name}  (slug=${r.slug})`);
  }
}
