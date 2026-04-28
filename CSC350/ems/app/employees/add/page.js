// Page for adding a new employee.

"use client";

import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import EmployeeForm from "@/components/EmployeeForm";

export default function AddEmployeePage() {
  const router = useRouter();

  // Called when form is submitted
  async function handleSubmit(formData) {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to create employee.");
    }

    // Go back to the list after saving
    router.push("/");
  }

  return (
    <div>
      <Navbar />
      <div className="pbody">
        <div className="form-page">
          {/* Breadcrumb navigation */}
          <div className="breadcrumb">
            <a href="/">Employees</a>
            <span>›</span>
            <span>Add New Employee</span>
          </div>

          <EmployeeForm onSubmit={handleSubmit} isEdit={false} />
        </div>
      </div>
    </div>
  );
}
