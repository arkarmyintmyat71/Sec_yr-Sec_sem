"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import Navbar from "@/components/Navbar";
import EmployeeCard from "@/components/EmployeeCard";
import EmployeeModal from "@/components/EmployeeModal";

const PER_PAGE = 10;

export default function EmployeeListPage() {
  const router = useRouter();

  // --- State ---
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  // --- Load employees ---
  async function loadEmployees() {
    try {
      setLoading(true);

      const res = await fetch(
        `/api/employees?search=${search}&status=${filter}`
      );

      if (!res.ok) throw new Error("Failed to fetch employees");

      const data = await res.json();
      setEmployees(data);
      setPage(1);

    } catch (err) {
      console.error(err);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEmployees();
  }, [search, filter]);

  // --- Safe data ---
  const safeEmployees = Array.isArray(employees) ? employees : [];

  // --- Pagination ---
  const totalPages = Math.ceil(safeEmployees.length / PER_PAGE) || 1;
  const start = (page - 1) * PER_PAGE;
  const visible = safeEmployees.slice(start, start + PER_PAGE);

  // Fix page overflow
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalPages, page]);

  // --- Handlers ---
  function handleEdit(id) {
    router.push(`/employees/${id}/edit`);
  }

  function handleView(employee) {
    setModal(employee);
  }

  async function handleDelete(employee) {
  const result = await Swal.fire({
    title: `Delete ${employee.firstName} ${employee.lastName}?`,
    text: "This action cannot be undone!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, delete it!",
  });

  if (!result.isConfirmed) return;

  try {
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      await Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to delete employee",
      });
      return;
    }

    // Close modal (if open)
    setModal(null);

    // Refresh list
    await loadEmployees();

    // Success popup
    await Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "Employee has been deleted.",
      timer: 1500,
      showConfirmButton: false,
    });

  } catch (error) {
    await Swal.fire({
      icon: "error",
      title: "Error",
      text: "Something went wrong",
    });
  }
}

return (
  <div>
    <Navbar />

    <div className="pbody">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="page-title">Employees</div>
          <div className="page-subtitle">
            {safeEmployees.length} members · Page {page} of {totalPages}
          </div>
        </div>

        <button
          className="btn-primary"
          onClick={() => router.push("/employees/add")}
        >
          + Add Employee
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        {/* Search */}
        <div className="search-box">
          <input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter */}
        <div className="filter-tabs">
          {["All", "Active", "Inactive", "On Leave"].map((tab) => (
            <button
              key={tab}
              className={`ftab ${filter === tab ? "active" : ""}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="loading">Loading employees…</div>
      ) : safeEmployees.length === 0 ? (
        <div className="empty-state">No employees found.</div>
      ) : visible.length === 0 ? (
        <div className="empty-state">No employees on this page.</div>
      ) : (
        <div className="employee-grid">
          {visible.map((emp) => (
            <EmployeeCard
              key={emp.id}
              employee={emp}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {safeEmployees.length > PER_PAGE && (
        <div className="pagination-row">
          <span className="pag-info">
            Showing {start + 1}–
            {Math.min(start + PER_PAGE, safeEmployees.length)} of{" "}
            {safeEmployees.length}
          </span>

          <div className="pag-buttons">
            {/* Prev */}
            <button
              className="pbtn"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ‹
            </button>

            {/* Numbers */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`pbtn ${p === page ? "current" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}

            {/* Next */}
            <button
              className="pbtn"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>

    {/* Modal */}
    <EmployeeModal
      employee={modal}
      onClose={() => setModal(null)}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  </div>
);
}