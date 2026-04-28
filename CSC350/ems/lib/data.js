import { query } from "@/utils/db";

// --- CRUD functions ---

// Get all employees
export async function getAllEmployees() {
  try {
    const rows = await query("SELECT * FROM employees");
    return rows;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch employees");
  }
}

// Get one employee by ID
export async function getEmployeeById(id) {
  try {
    const rows = await query(
      "SELECT * FROM employees WHERE id = ?",
      [id]
    );
    return rows[0] || null;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to fetch employee");
  }
}

// Add a new employee
export async function createEmployee(data) {
  // Validation
  if (!data.firstName || !data.lastName || !data.email) {
    throw new Error("First name, last name, and email are required.");
  }

  try {
    const result = await query(
      `INSERT INTO employees 
      (firstName, lastName, position, department, email, phone, hireDate, salary, nationality, address, status, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.firstName || "",
        data.lastName || "",
        data.position || "",
        data.department || "",
        data.email || "",
        data.phone || "",
        data.hireDate || null,
        parseFloat(data.salary) || 0,
        data.nationality || "Thai",
        data.address || "",
        data.status || "Active",
        data.avatar || "",
      ]
    );

    return {
      id: result.insertId,
      ...data,
      salary: parseFloat(data.salary) || 0,
      nationality: data.nationality || "Thai",
      status: data.status || "Active",
    };
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create employee");
  }
}

// Update an existing employee
export async function updateEmployee(id, data) {
  try {
    const result = await query(
      `UPDATE employees SET 
        firstName = ?, 
        lastName = ?, 
        position = ?, 
        department = ?, 
        email = ?, 
        phone = ?, 
        hireDate = ?, 
        salary = ?, 
        nationality = ?, 
        address = ?, 
        status = ?, 
        avatar = ?
      WHERE id = ?`,
      [
        data.firstName,
        data.lastName,
        data.position,
        data.department,
        data.email,
        data.phone,
        data.hireDate || null,
        parseFloat(data.salary) || 0,
        data.nationality,
        data.address,
        data.status,
        data.avatar,
        id,
      ]
    );

    if (result.affectedRows === 0) return null;

    const rows = await query("SELECT * FROM employees WHERE id = ?", [id]);
    return rows[0];
  } catch (error) {
    console.error(error);
    throw new Error("Failed to update employee");
  }
}

// Delete an employee
export async function deleteEmployee(id) {
  try {
    const result = await query(
      "DELETE FROM employees WHERE id = ?",
      [id]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to delete employee");
  }
}