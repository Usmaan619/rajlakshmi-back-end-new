const {
  forgetPasswordTemplate,
} = require("../../emailTemplates/forgetPasswordTemplate");
const { createEmailTransporter, withConnection } = require("../../utils/helper");

//generate OTP 6 digits
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000);
};

//send OTP email
exports.sendOTPEmail = async (to, hostname) => {
  try {
    const otp = generateOTP(); // Generate OTP
    const transporter = await createEmailTransporter();

    const mailOptions = {
      from: process.env.SMTP_SIW_USER,
      to,
      subject: "Forget Password",
      text: `Your OTP for resetting your password is: ${otp}`,
      html: forgetPasswordTemplate(otp, hostname),
      //   to: "donotreply-cloustest@medtronic.com",
    };

    const info = await transporter.sendMail(mailOptions);

    await setForgotPasswordOtp(to, otp);

    return info;
  } catch (error) {
    console.log("Error sending OTP email:", error);
    throw error;
  }
};

exports.findUserByEmail = async (email) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM organic_farmer_admin_user WHERE email = ?`;
      const [rows] = await connection.execute(query, [email]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("Error ", error);
    return error;
  }
};

exports.findUserOTP = async (otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `SELECT * FROM organic_farmer_admin_user WHERE otp = ?`;
      const [rows] = await connection.execute(query, [otp]);
      return rows[0] || null;
    });
  } catch (error) {
    console.log("error: ", error);
    throw error;
  }
};
/// Re-set password
exports.resetPassword = async (email, otp, hashedPassword) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE organic_farmer_admin_user SET password = ? ,otp = NULL WHERE email = ? AND otp = ?`;
      const [rows] = await connection.execute(query, [
        hashedPassword,
        email,
        otp,
      ]);
      if (rows.affectedRows > 0) {
        return { message: "Password reset sucessfully" };
      }
    });
  } catch (error) {
    console.log("Error in resetpassword:", error);
    throw error;
  }
};

const setForgotPasswordOtp = async (email, otp) => {
  try {
    return await withConnection(async (connection) => {
      const query = `UPDATE organic_farmer_admin_user SET otp = ?  WHERE email = ? `;
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
