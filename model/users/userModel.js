const {
  withConnection,
  createEmailTransporter,
} = require("../../utils/helper");
const {
  forgetPasswordTemplate,
} = require("../../emailTemplates/forgetPasswordTemplate");

//generate OTP 6 digits
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.findUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_user_new WHERE email = ? LIMIT 1`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("findUserByEmail error: ", error);
    throw error;
  }
};

exports.userRegister = async (userTable) => {
  const {
    full_name,
    email,
    mobile_number,
    password,
    profile_image,
    role,
    permissions,
  } = userTable;

  try {
    return await withConnection(async (connection) => {
      const query = `
        INSERT INTO rajlaxmi_user_new 
          (full_name, email, mobile_number, password, profile_image, role, permissions, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
      `;

      const [results] = await connection.execute(query, [
        full_name,
        email,
        mobile_number || null,
        password || null,
        profile_image || null,
        role || "user",
        permissions ? JSON.stringify(permissions) : null,
      ]);

      return results;
    });
  } catch (error) {
    console.log("userRegister error: ", error);
    throw error;
  }
};

// Send OTP email
exports.sendOTPEmail = async (to, hostname) => {
  try {
    const otp = generateOTP(); // Generate OTP
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_SIW_USER,
      to,
      subject: "Forgot Password",
      text: `Your OTP for resetting your password is: ${otp}`,
      html: forgetPasswordTemplate(otp, hostname),
    };

    const info = await transporter.sendMail(mailOptions);
    await exports.setForgotPasswordOtp(to, otp);
    return info;
  } catch (error) {
    console.log("Error sending OTP email:", error);
    throw error;
  }
};

exports.setForgotPasswordOtp = async (email, otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE rajlaxmi_user_new SET otp = ? WHERE email = ?`;
      const [rows] = await connection.execute(query, [otp, email]);
      if (rows.affectedRows > 0) {
        return { message: "save otp sucessfully" };
      }
    });
  } catch (error) {
    console.log("Error in setForgotPasswordOtp:", error);
    throw error;
  }
};

exports.findUserOTP = async (otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM rajlaxmi_user_new WHERE otp = ?`;
      const [rows] = await connection.execute(query, [otp]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("error: ", error);
    throw error;
  }
};

exports.resetPassword = async (email, otp, hashedPassword) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE rajlaxmi_user_new SET password = ?, otp = NULL WHERE email = ? AND otp = ?`;
      const [rows] = await connection.execute(query, [
        hashedPassword,
        email,
        otp,
      ]);
      if (rows.affectedRows > 0) {
        return { message: "Password reset successfully" };
      }
      return null;
    });
  } catch (error) {
    console.log("Error in resetpassword:", error);
    throw error;
  }
};

exports.updateUser = async (userId, updateData) => {
  try {
    return await withConnection(async (connection) => {
      const { full_name, mobile_number, profile_image } = updateData;
      const query = `
        UPDATE rajlaxmi_user_new 
        SET full_name = ?, mobile_number = ?, profile_image = ? 
        WHERE id = ?
      `;
      const [result] = await connection.execute(query, [
        full_name,
        mobile_number,
        profile_image,
        userId,
      ]);
      return result.affectedRows > 0;
    });
  } catch (error) {
    console.log("updateUser error: ", error);
    throw error;
  }
};
