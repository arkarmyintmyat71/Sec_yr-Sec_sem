// Shows one employee as a card in the grid.
// Props:
//   employee
//   onView 
//   onEdit
//   onDelete

"use client";

// Avatar colors
const COLORS = [
  { bg: "#dbeafe", text: "#1d4ed8" },
  { bg: "#dcfce7", text: "#15803d" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#9d174d" },
  { bg: "#ede9fe", text: "#6d28d9" },
  { bg: "#ffedd5", text: "#c2410c" },
];

// Helpers
const getColor = (name = "") =>
  COLORS[name.charCodeAt(0) % COLORS.length];

const getInitials = (f = "", l = "") =>
  `${f[0] || ""}${l[0] || ""}`.toUpperCase();

const getStatusClass = (s) =>
  s === "Active"
    ? "dot-active"
    : s === "Inactive"
    ? "dot-inactive"
    : "dot-leave";

export default function EmployeeCard({ employee, onView, onEdit, onDelete }) {
  const {
    id,
    firstName,
    lastName,
    avatar,
    status,
    email,
    phone,
    position,
    department,
  } = employee;

  const initials = getInitials(firstName, lastName);
  const color = getColor(firstName);

  return (
    <div className="ecard" onClick={() => onView(employee)}>

      {/* Status dot */}
      <div className={`status-dot ${getStatusClass(status)}`} />

      {/* Avatar */}
      <div
        className="card-avatar"
        style={{
          background: avatar ? "transparent" : color.bg,
          color: color.text,
        }}
      >
        {avatar ? (
          <img
            src={avatar}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          initials
        )}
      </div>

      {/* Info */}
      <div className="card-name">
        {firstName} {lastName}
      </div>
      <div className="card-position">{position}</div>
      <div className="card-dept">{department}</div>

      <div className="card-divider" />

      {/* Contact */}
      <div className="card-meta">
        <div className="meta-row">{email}</div>
        <div className="meta-row">{phone}</div>
      </div>

      {/* Actions */}
      <div
        className="card-actions"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="btn-edit" onClick={() => onEdit(id)}>
          Edit
        </button>
        <button className="btn-delete" onClick={() => onDelete(employee)}>
          Delete
        </button>
      </div>
    </div>
  );
}