const asyncHandler = require("express-async-handler");
const registerModel = require("../../model/admin/registerModel");
const bcrypt = require("bcryptjs");
const authMiddleware = require("../../middlewares/authMiddleware");

exports.adminUserRegister = asyncHandler(async (req, res) => {
  const { full_name, email, mobile_number, password, role,permissions } = req.body;

  //Validation
  if (
    !full_name &&
    !email &&
    !mobile_number &&
    !password &&
    !role
    // || !confirm_password
  ) {
    return res.json({ message: "All fields are required" });
  }

  try {
    //Check if email already exists in database
    const emailExist = await registerModel.findAdminUserByEmail(email);
    if (emailExist) {
      return res.json({ message: "Email already exist" });
    }

    //hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    const newRegister = {
      full_name,
      email,
      mobile_number,
      password: hashedPassword,
      role,
      permissions,
    };

    await registerModel.adminUserRegister(newRegister);
    res
      .status(201)
      .json({ success: true, message: "User Register Successfully" });
  } catch (error) {
    res.json({ message: "Database error", error: error.message });
  }
});

exports.meAPI = asyncHandler(async (req, res) => {
  try {
    delete req.user.password;
    const user = req.user;
    res.json({ user, msg: "sss" });
  } catch (error) {
    res.send("An error occured");
  }
});

exports.getAllGauswarnUsers = asyncHandler(async (req, res) => {
  try {
    const { page = 1, limit = 100, search = "" } = req.query;

    const users = await registerModel.getAllGauswarnUsers({
      search,
      page,
      limit,
    });

    res.status(200).json({
      success: true,
      users: users.rows,
      total: users.total,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Database error" });
  }
});

// UPDATE USER
exports.updateUser = asyncHandler(async (req, res) => {
  try {
    const id = req.params.id;
    const { full_name, email, mobile_number, role, permissions } = req.body;

    await registerModel.updateUser(id, {
      full_name,
      email,
      mobile_number,
      role,
      permissions: permissions.join(","),
    });

    res.json({ success: true, message: "User updated" });
  } catch (error) {
    res.status(500).json({ message: "Update error" });
  }
});

// DELETE USER
exports.deleteUser = asyncHandler(async (req, res) => {
  try {
    await registerModel.deleteUser(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete error" });
  }
});

// READ - All
exports.getAllUsers = asyncHandler(async (req, res) => {
  try {
    const customers = await registerModel.getAllUsers();
    res.status(200).json({ success: true, customers });
  } catch (error) {
    console.error("Get All Contacts Error:", error);
    throw error;
  }
});
