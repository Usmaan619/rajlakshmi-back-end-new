// const { withConnection } = require("../../utils/helper");

const { withConnection } = require("../../utils/helper");

// exports.findAdminUserByEmail = async (email) => {
//   try {
//     return await withConnection(async (connection) => {
//       const query = `SELECT * FROM organic_farmer_admin_user WHERE email = ?`;
//       const [rows] = await connection.execute(query, [email]);
//       return rows[0] || null;
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return error;
//   }
// };

// // Registration new user
// exports.adminUserRegister = async (registerTable) => {
//   const { full_name, email, mobile_number, password, role } = registerTable;

//   //MySQl query
//   try {
//     return await withConnection(async (connection) => {
//       const query = `INSERT INTO organic_farmer_admin_user (full_name, email, mobile_number, password,role) VALUES (?, ?, ?, ?, ?)`;

//       //Execute the query
//       const [results] = await connection.execute(query, [
//         full_name,
//         email,
//         mobile_number,
//         password,
//         role,
//       ]);
//       return results;
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return error;
//   }
// };

// exports.findUserById = async (uid) => {
//   try {
//     return await withConnection(async (connection) => {
//       const query = `SELECT * FROM rajlaxmi_user WHERE uid = ?`;
//       const [rows] = await connection.execute(query, [uid]);
//       return rows[0] || null;
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return error;
//   }
// };

// exports.getAllUsers = async () => {
//   try {
//     return await withConnection(async (connection) => {
//       const query = `SELECT * FROM rajlaxmi_user`;
//       const [rows] = await connection.execute(query);
//       return rows || null;
//     });
//   } catch (error) {
//     console.log("error: ", error);
//     return error;
//   }
// };

// model/admin/registerModel.js

//  Find admin by email (login के लिए)
exports.findAdminUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user WHERE email = ? LIMIT 1`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("findAdminUserByEmail error: ", error);
    throw error;
  }
};

//  Registration / create new admin user
exports.adminUserRegister = async (registerTable) => {
  const { full_name, email, mobile_number, password, role, permissions } =
    registerTable;

  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO gauswarn_admin_user 
          (full_name, email, mobile_number, password, role, permissions) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      const [results] = await connection.execute(query, [
        full_name,
        email,
        mobile_number,
        password,
        role || "admin",
        permissions ? JSON.stringify(permissions) : null, // 👈 store as JSON string
      ]);

      return results;
    });
  } catch (error) {
    console.log("adminUserRegister error: ", error);
    throw error;
  }
};

//  Get all admin users
exports.getAllAdminUsers = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM gauswarn_admin_user ORDER BY id DESC`;
      const [rows] = await connection.execute(query);
      return rows || [];
    });
  } catch (error) {
    console.log("getAllAdminUsers error: ", error);
    throw error;
  }
};

//  Update admin user (permissions, role, आदि)
exports.updateAdminUser = async (id, updateData) => {
  const { full_name, email, mobile_number, role, permissions, status } =
    updateData;

  try {
    return await withConnection(async (connection) => {
      const fields = [];
      const values = [];

      if (full_name !== undefined) {
        fields.push("full_name = ?");
        values.push(full_name);
      }
      if (email !== undefined) {
        fields.push("email = ?");
        values.push(email);
      }
      if (mobile_number !== undefined) {
        fields.push("mobile_number = ?");
        values.push(mobile_number);
      }
      if (role !== undefined) {
        fields.push("role = ?");
        values.push(role);
      }
      if (permissions !== undefined) {
        fields.push("permissions = ?");
        values.push(JSON.stringify(permissions));
      }
      if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
      }

      if (!fields.length) {
        return { affectedRows: 0 };
      }

      const query = `
        UPDATE gauswarn_admin_user 
        SET ${fields.join(", ")} 
        WHERE id = ?
      `;
      values.push(id);

      const [result] = await connection.execute(query, values);
      return result;
    });
  } catch (error) {
    console.log("updateAdminUser error: ", error);
    throw error;
  }
};

//  Delete admin user
exports.deleteAdminUser = async (id) => {
  try {
    return await withConnection(async (connection) => {
      const query = `DELETE FROM gauswarn_admin_user WHERE id = ?`;
      const [result] = await connection.execute(query, [id]);
      return result;
    });
  } catch (error) {
    console.log("deleteAdminUser error: ", error);
    throw error;
  }
};

exports.getAllUsers = async () => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_user`;
      const [rows] = await connection.execute(query);
      return rows || null;
    });
  } catch (error) {
    console.log("error: ", error);
    return error;
  }
};

exports.getAllGauswarnUsers = async ({ search, page, limit }) => {
  return await withConnection(async (connection) => {
    const offset = (page - 1) * limit;

    const searchSql = search
      ? `WHERE full_name LIKE '%${search}%' OR email LIKE '%${search}%' OR mobile_number LIKE '%${search}%'`
      : "";

    const totalQuery = `SELECT COUNT(*) as total FROM gauswarn_admin_user ${searchSql}`;
    const [[totalResult]] = await connection.execute(totalQuery);

    const query = `
      SELECT *
      FROM gauswarn_admin_user
      ${searchSql}
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    const [rows] = await connection.execute(query);

    return {
      rows,
      total: totalResult.total,
    };
  });
};

exports.updateUser = async (id, data) => {
  return await withConnection(async (connection) => {
    const query = `
      UPDATE gauswarn_admin_user SET 
      full_name=?,
      email=?,
      mobile_number=?,
      role=?,
      permissions=?
      WHERE id=?
    `;

    await connection.execute(query, [
      data.full_name,
      data.email,
      data.mobile_number,
      data.role,
      data.permissions,
      id,
    ]);
  });
};

exports.deleteUser = async (id) => {
  return await withConnection(async (connection) => {
    const query = `DELETE FROM gauswarn_admin_user WHERE id = ?`;
    await connection.execute(query, [id]);
  });
};
