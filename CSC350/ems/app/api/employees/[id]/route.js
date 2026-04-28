// API endpoints for a single employee:
//   GET    /api/employees/1  → get one employee
//   PUT    /api/employees/1  → update one employee
//   DELETE /api/employees/1  → delete one employee

import { NextResponse } from "next/server";
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/data";

// GET /api/employees/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const employee = await getEmployeeById(id); // await

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch employee" },
      { status: 500 }
    );
  }
}
// PUT /api/employees/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const data = await request.json();

    const updated = await updateEmployee(id, data); // await

    if (!updated) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(updated);

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const success = await deleteEmployee(id);

    if (!success) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Deleted successfully" });

  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete employee" },
      { status: 500 }
    );
  }
}
