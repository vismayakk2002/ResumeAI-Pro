import "../styles/dashboardCard.css";

function DashboardCard({ title, description, onClick }) {
  return (
    <div className="dashboard-card" onClick={onClick}>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
  );
}

export default DashboardCard;