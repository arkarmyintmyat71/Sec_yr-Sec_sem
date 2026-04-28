// API endpoints for the employees collection:
//   GET  /api/employees  → returns all employees (with optional search & filter)
//   POST /api/employees  → creates a new employee

import { NextResponse } from "next/server";
import { getAllEmployees, createEmployee } from "@/lib/data";

// GET
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "All";

  let employees = await getAllEmployees(); // MUST await

  // Filter by status
  if (status !== "All") {
    employees = employees.filter((e) => e.status === status);
  }

  // Filter by search
  if (search) {
    const lower = search.toLowerCase();
    employees = employees.filter((e) =>
      `${e.firstName} ${e.lastName}`.toLowerCase().includes(lower)
    );
  }

  return NextResponse.json(employees);
}
// POST
export async function POST(request) {
  try {
    const data = await request.json(); // parse here

    const newEmployee = await createEmployee(data); // pass data only

    return NextResponse.json(newEmployee, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}