import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "conic-gradient(from 220deg, #7df0c2, #7ab8ff, #f6c177, #7df0c2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "60%",
            height: "60%",
            background: "#04060c",
            borderRadius: 6,
          }}
        />
      </div>
    ),
    size,
  );
}
