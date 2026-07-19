export default function Skeleton({ h = 14, w = "100%", r = 12 }) {
  return (
    <div
      style={{
        height: h,
        width: w,
        borderRadius: r,
        background: "linear-gradient(90deg, rgba(2,6,23,.06), rgba(2,6,23,.10), rgba(2,6,23,.06))",
        backgroundSize: "200% 100%",
        animation: "skeletonShimmer 1.2s ease-in-out infinite",
      }}
    />
  );
}

