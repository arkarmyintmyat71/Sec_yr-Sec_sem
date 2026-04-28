// Page for editing an existing employee.
// The [id] in the folder name is a dynamic route parameter.

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import EmployeeForm from "@/components/EmployeeForm";

export default function EditEmployeePage() {
  const router = useRouter();
  const { id } = useParams(); // get the employee ID from the URL

  const [employee, setEmployee] = useState(null); // loaded employee data
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Load the employee data when the page opens
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/employees/${id}`);
      if (res.status === 404) {
        setNotFound(true);
      } else {
        const data = await res.json();
        // Format hireDate from MySQL Date object to YYYY-MM-DD string
        // so the <input type="date"> displays it correctly
        if (data.hireDate) {
          data.hireDate = new Date(data.hireDate).toISOString().split("T")[0];
        }
        setEmployee(data);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  // Called when form is submitted
  async function handleSubmit(formData) {
    const res = await fetch(`/api/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to update employee.");
    }

    // Go back to the list after saving
    router.push("/");
  }

  return (
    <div>
      <Navbar />
      <div className="pbody">
        <div className="form-page">
          {/* Breadcrumb */}
          <div className="breadcrumb">
            <a href="/">Employees</a>
            <span>›</span>
            <span>Edit Employee</span>
          </div>

          {loading && <div className="loading">Loading employee data…</div>}

          {notFound && (
            <div className="empty-state">
              Employee not found. <a href="/" style={{ color: "#0872f5" }}>Go back</a>
            </div>
          )}

          {/* Show form once data is loaded */}
          {!loading && !notFound && employee && (
            <EmployeeForm
              initialData={employee}
              onSubmit={handleSubmit}
              isEdit={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
