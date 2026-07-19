function FeatureCard({ title, description }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: "10px",
        padding: "20px",
        width: "250px",
        textAlign: "center",
      }}
    >
      <h3>{title}</h3>

      <p>{description}</p>
    </div>
  );
}

export default FeatureCard;