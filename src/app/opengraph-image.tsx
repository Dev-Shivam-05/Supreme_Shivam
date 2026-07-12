import { ImageResponse } from "next/og";

export const alt = "Shivam Bhadoriya — Full-Stack Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08080a",
          backgroundImage:
            "radial-gradient(60% 60% at 20% 10%, rgba(203,255,60,0.16), transparent), radial-gradient(50% 50% at 100% 100%, rgba(203,255,60,0.10), transparent)",
          padding: "72px",
          color: "#f3f3ef",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              background: "#cbff3c",
              color: "#0a0a08",
              fontSize: "26px",
              fontWeight: 800,
            }}
          >
            SB
          </div>
          <div style={{ fontSize: "22px", letterSpacing: "6px", color: "#8f8f88" }}>
            THE OBSERVABLE MACHINE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "120px", fontWeight: 800, lineHeight: 1, letterSpacing: "-3px" }}>
            SHIVAM
          </div>
          <div style={{ fontSize: "120px", fontWeight: 800, lineHeight: 1, letterSpacing: "-3px", color: "#cbff3c" }}>
            BHADORIYA
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ fontSize: "30px", color: "#c9c9c2" }}>
            Full-Stack Engineer · MERN · Realtime · Performance
          </div>
          <div style={{ fontSize: "22px", color: "#8f8f88" }}>shivam-bhadoriya-dev.vercel.app</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
