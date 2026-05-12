import { ImageResponse } from "next/og";

/**
 * OG image dynamique : /api/og?title=...&subtitle=...&category=...&variant=...
 *
 * Utilisee comme image Open Graph + Twitter Card pour les pages avec
 * besoin d'OG dynamique. 1200x630, format standard OG.
 *
 * Variants :
 *  - default (homepage, simulateurs, glossaire)
 *  - blog (article : category badge + author footer)
 *  - product (academy, family : prix mis en avant)
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

type Variant = "default" | "blog" | "product";

function pickVariant(raw: string | null): Variant {
  if (raw === "blog" || raw === "product") return raw;
  return "default";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = (searchParams.get("title") || "Emeline Siron").slice(0, 200);
  const subtitle = (searchParams.get("subtitle") || "").slice(0, 180);
  const category = (searchParams.get("category") || "").slice(0, 60);
  const author = (searchParams.get("author") || "Emeline Siron").slice(0, 60);
  const variant = pickVariant(searchParams.get("variant"));

  const titleFontSize = title.length > 80 ? 56 : title.length > 50 ? 66 : 76;

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

        {/* Header brand */}
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
            marginBottom: "20px",
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
          {category || (variant === "product" ? "ES Academy" : "Emeline Siron")}
        </div>

        {/* Title principal */}
        <div
          style={{
            display: "flex",
            fontSize: titleFontSize,
            lineHeight: 1.1,
            color: COLORS.text,
            fontWeight: 700,
            marginTop: "10px",
            maxWidth: "1020px",
          }}
        >
          {title}
        </div>

        {/* Subtitle (variants product/blog longs) */}
        {subtitle && (
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.35,
              color: COLORS.textMuted,
              marginTop: "24px",
              maxWidth: "980px",
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Badge produit (variant product) */}
        {variant === "product" && !subtitle && (
          <div
            style={{
              display: "flex",
              marginTop: "30px",
              padding: "10px 22px",
              background: COLORS.green,
              color: COLORS.cream,
              fontSize: "22px",
              borderRadius: "999px",
              fontWeight: 600,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            La methode complete pour investir
          </div>
        )}

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
              {variant === "blog" ? "Par" : "Avec"}
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
