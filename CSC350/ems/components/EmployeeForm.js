// both Add and Edit pages.
// Props:
//   onSubmit
//   isEdit

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEPARTMENTS = [
  "Engineering", "Marketing", "Human Resources", "Sales",
  "Design", "Finance", "Product", "Legal", "Operations",
];

const NATIONALITIES = [
  "Thai", "American", "British", "Australian", "Filipino",
  "Japanese", "Chinese", "Indian", "Korean", "Myanmar", "Other",
];

// Avatar colors
const AVATAR_COLORS = [
  { bg: "#dbeafe", color: "#1d4ed8" },
  { bg: "#dcfce7", color: "#15803d" },
  { bg: "#fef3c7", color: "#92400e" },
  { bg: "#fce7f3", color: "#9d174d" },
  { bg: "#ede9fe", color: "#6d28d9" },
  { bg: "#ffedd5", color: "#c2410c" },
];

function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export default function EmployeeForm({ initialData = {}, onSubmit, isEdit = false }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state — pre-fill with initialData (for edit) or defaults (for add)
  const [form, setForm] = useState({
    firstName: initialData.firstName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    position: initialData.position || "",
    department: initialData.department || "",
    hireDate: initialData.hireDate || "",
    salary: initialData.salary || "",
    nationality: initialData.nationality || "Thai",
    address: initialData.address || "",
    status: initialData.status || "Active",
    avatar: initialData.avatar || "",
  });

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      handleChange("avatar", reader.result);
    };
    reader.readAsDataURL(file);
  }

  // Update one field in the form
  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Submit the form
  async function handleSubmit() {
    setError("");

    // Validate required fields
    if (!form.firstName || !form.lastName || !form.email) {
      setError("Please fill in First Name, Last Name, and Email.");
      return;
    }

    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      // Show the real error message from the API
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const initials = `${form.firstName[0] || ""}${form.lastName[0] || ""}`.toUpperCase() || "?";
  const avatarColor = getAvatarColor(form.firstName);

  return (
    <div className="form-card">
      {/* Card header */}
      <div className="form-card-header">
        <div className="form-card-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0872f5" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
            {!isEdit && <><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></>}
          </svg>
        </div>
        <div>
          <div className="form-card-title">
            {isEdit ? "Edit Employee" : "Add New Employee"}
          </div>
          <div className="form-card-subtitle">
            {isEdit
              ? "Update the employee's information below"
              : "Fill in the details to create a new employee record"}
          </div>
        </div>
      </div>

      <div className="form-card-body">
        {/* Image Upload */}
        <div className="avatar-upload">
          <label style={{ cursor: "pointer" }}>
            <div className="avatar-circle">
              {form.avatar ? (
                <img src={form.avatar} alt="avatar" />
              ) : (
                initials
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageUpload}
            />
          </label>
          <div>
            <div className="avatar-info-title">Employee Photo</div>
            <div className="avatar-info-hint">Click avatar to upload image</div>
          </div>
        </div>

        {/* Section: Personal Information */}
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0872f5" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Personal Information
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">First Name <span className="req">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Alice"
              value={form.firstName}
              onChange={(e) => handleChange("firstName", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Last Name <span className="req">*</span></label>
            <input
              className="form-input"
              placeholder="e.g. Johnson"
              value={form.lastName}
              onChange={(e) => handleChange("lastName", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Email <span className="req">*</span></label>
            <input
              className="form-input"
              type="email"
              placeholder="alice@company.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              placeholder="08X XXX XXXX"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Nationality</label>
            {/* FIX: added value={n} so React controlled select works correctly */}
            <select
              className="form-input"
              value={form.nationality}
              onChange={(e) => handleChange("nationality", e.target.value)}
            >
              {NATIONALITIES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="form-field full">
            <label className="form-label">Address</label>
            <input
              className="form-input"
              placeholder="Street, city, province…"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>
        </div>

        {/* Section: Job Details */}
        <div className="section-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0872f5" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
          Job Details
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Position</label>
            <input
              className="form-input"
              placeholder="e.g. Software Engineer"
              value={form.position}
              onChange={(e) => handleChange("position", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Department</label>
            {/* FIX: added value={d} so the saved department pre-selects correctly on edit */}
            <select
              className="form-input"
              value={form.department}
              onChange={(e) => handleChange("department", e.target.value)}
            >
              <option value="">Select department…</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label className="form-label">Hire Date</label>
            <input
              className="form-input"
              type="date"
              value={form.hireDate}
              onChange={(e) => handleChange("hireDate", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label className="form-label">Salary (USD)</label>
            <input
              className="form-input"
              type="number"
              placeholder="e.g. 75000"
              value={form.salary}
              onChange={(e) => handleChange("salary", e.target.value)}
            />
          </div>

          {/* Status selector */}
          <div className="form-field full">
            <label className="form-label">Employment Status</label>
            <div className="status-group">
              {[
                { label: "Active", cls: "sel-active", dot: "#22c55e" },
                { label: "Inactive", cls: "sel-inactive", dot: "#94a3b8" },
                { label: "On Leave", cls: "sel-leave", dot: "#f59e0b" },
              ].map(({ label, cls, dot }) => (
                <button
                  key={label}
                  type="button"
                  className={`status-option ${form.status === label ? cls : ""}`}
                  onClick={() => handleChange("status", label)}
                >
                  <span className="status-dot-sm" style={{ background: dot }} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ color: "#b91c1c", fontSize: "0.82rem", marginBottom: "12px" }}>
            {error}
          </div>
        )}

        {/* Footer: Cancel + Save */}
        <div className="form-footer">
          <span className="form-footer-hint">
            Fields marked <span className="req">*</span> are required.
          </span>
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn-ghost" onClick={() => router.push("/")}>
              Cancel
            </button>
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Employee"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}