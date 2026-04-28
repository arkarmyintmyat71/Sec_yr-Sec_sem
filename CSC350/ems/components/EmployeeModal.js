//Shows full employee details in a popup modal.
//Props:
//employee - the employee to display (or null to hide)
//onClose
//onEdit
//onDelete

"use client";

const COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#ffedd5", color: "#c2410c" },
];

// Helpers
const getAvatarColor = (name = "") =>
  COLORS[name.charCodeAt(0) % COLORS.length] || COLORS[0];

const getInitials = (f = "", l = "") =>
  `${f[0] || ""}${l[0] || ""}`.toUpperCase();

const badgeClass = {
  Active: "badge badge-active",
  Inactive: "badge badge-inactive",
  "On Leave": "badge badge-leave",
};

const formatSalary = (n) =>
  n
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

export default function EmployeeModal({ employee, onClose, onEdit, onDelete }) {
  if (!employee) return null;

  const { firstName, lastName, avatar, status } = employee;

  const initials = getInitials(firstName, lastName);
  const color = getAvatarColor(firstName);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h2>Employee Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Body */}
        <div className="modal-body">

          {/* Profile */}
          <div style={{ textAlign: "center", marginBottom: 8 }}>
            <div
              className="modal-avatar"
              style={{ ...color, margin: "0 auto 12px" }}
            >
              {avatar ? (
                <img src={avatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} />
              ) : (
                initials
              )}
            </div>

            <div className="modal-name">
              {firstName} {lastName}
            </div>

            <div className="modal-pos">
              {employee.position} · {employee.department}
            </div>

            <span className={badgeClass[status] || badgeClass["On Leave"]}>
              {status}
            </span>
          </div>

          {/* Details */}
          <div className="modal-detail-grid">
            {[
              ["Email", employee.email],
              ["Phone", employee.phone || "—"],
              ["Hire Date", formatDate(employee.hireDate)],
              ["Salary", formatSalary(employee.salary)],
              ["Nationality", employee.nationality || "—"],
              ["Address", employee.address || "—"],
            ].map(([label, value]) => (
              <div key={label} className="detail-item">
                <label>{label}</label>
                <span>{value}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button
              className="btn-primary"
              style={{ flex: 1 }}
              onClick={() => onEdit(employee.id)}
            >
              Edit
            </button>

            <button
              className="btn-ghost"
              style={{ flex: 1, color: "#b91c1c", borderColor: "#fecaca" }}
              onClick={() => onDelete(employee)}
            >
              Delete
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}