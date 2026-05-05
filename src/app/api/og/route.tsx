import { ImageResponse } from "next/og";

/**
 * OG image dynamique : /api/og?title=...&category=...
 *
 * Utilisee comme image Open Graph + Twitter Card pour les articles de blog
 * qui n'ont pas de FeaturedImage Notion (boost partage social, plus de
 * backlinks indirects). 1200x630, format standard OG.
 *
 * Pas de font custom (les system fonts du runtime suffisent et evitent
 * un fetch reseau qui ralentirait la generation).
 */

export const runtime = "edge";

const COLORS = {
  cream: "#F7F1E5",
  green: "#1F4133",
  greenDark: "#0E2B22",
  gold: "#C9A86A",
  text: "#1F2A24",
  textMuted: "#5C6B62",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Emeline Siron").slice(0, 200);
  const category = (searchParams.get("category") || "").slice(0, 60);
  const author = (searchParams.get("author") || "Emeline Siron").slice(0, 60);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${COLORS.cream} 0%, #EDE3CB 100%)`,
          padding: "80px 90px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Bandeau gold accent en haut */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.green} 100%)`,
          }}
        />

        {/* Categorie en haut */}
        {category && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "22px",
              textTransform: "uppercase",
              letterSpacing: "3px",
              color: COLORS.green,
              fontFamily: "Helvetica, Arial, sans-serif",
              fontWeight: 600,
              marginBottom: "30px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: COLORS.gold,
                display: "block",
              }}
            />
            {category}
          </div>
        )}

        {/* Title principal */}
        <div
          style={{
            display: "flex",
            fontSize: title.length > 80 ? "58px" : title.length > 50 ? "68px" : "78px",
            lineHeight: 1.1,
            color: COLORS.text,
            fontWeight: 700,
            marginTop: category ? "10px" : "60px",
            maxWidth: "1020px",
          }}
        >
          {title}
        </div>

        {/* Spacer pour pousser le footer en bas */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Footer : author + site URL */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `2px solid ${COLORS.green}`,
            paddingTop: "30px",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span
              style={{
                fontSize: "20px",
                color: COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "2px",
              }}
            >
              Par
            </span>
            <span
              style={{
                fontSize: "32px",
                color: COLORS.green,
                fontWeight: 700,
                fontFamily: "Georgia, serif",
                marginTop: "4px",
              }}
            >
              {author}
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "24px",
              color: COLORS.green,
              fontWeight: 600,
            }}
          >
            emeline-siron.fr
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
