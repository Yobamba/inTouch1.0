const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const { getDb } = require("../db/connection");
require("dotenv").config();

// Email configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD
  }
});

class Auth {
  static generateVerificationCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async sendVerificationEmail(email, code) {
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: "Password Recovery - Verification Code",
      text: `
        Hello,
        
        Your verification code for password recovery is: ${code}
        
        This code will expire in 15 minutes.
        
        If you did not request this code, please ignore this email.
        
        Best regards,
        Original Coast Clothing Team
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }

  static async registerUser(username, email, password) {
    const db = getDb();
    const users = db.collection("Users");

    // Check if username or email already exists
    const existingUser = await users.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return {
        success: false,
        message: existingUser.username === username
          ? "Username already taken"
          : "Email already registered"
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    await users.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date()
    });

    return { success: true, message: "Registration successful" };
  }

  static async loginUser(username, password) {
    const db = getDb();
    const users = db.collection("Users");
    
    const user = await users.findOne({ username });
    
    if (!user) {
      return { success: false, message: "Invalid username or password" };
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return { success: false, message: "Invalid username or password" };
    }

    return { success: true, message: "Login successful" };
  }

  static async initiatePasswordReset(email) {
    const db = getDb();
    const users = db.collection("Users");
    const recovery = db.collection("PasswordRecovery");
    
    const user = await users.findOne({ email });
    if (!user) {
      return { success: false, message: "Email not found" };
    }

    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing recovery attempts
    await recovery.deleteMany({ email });

    // Create new recovery document
    await recovery.insertOne({
      email,
      code,
      expiresAt,
      used: false
    });

    try {
      await this.sendVerificationEmail(email, code);
      return { success: true, message: "Verification code sent to email" };
    } catch (error) {
      return { success: false, message: "Failed to send verification email" };
    }
  }

  static async verifyCode(email, code) {
    const db = getDb();
    const recovery = db.collection("PasswordRecovery");
    
    const record = await recovery.findOne({
      email,
      code,
      expiresAt: { $gt: new Date() },
      used: false
    });

    return record ? { success: true } : { success: false, message: "Invalid or expired code" };
  }

  static async resetPassword(email, code, newPassword) {
    const db = getDb();
    const users = db.collection("Users");
    const recovery = db.collection("PasswordRecovery");

    const record = await recovery.findOne({
      email,
      code,
      expiresAt: { $gt: new Date() },
      used: false
    });

    if (!record) {
      return { success: false, message: "Invalid or expired code" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and mark recovery code as used
    await users.updateOne(
      { email },
      { $set: { password: hashedPassword }}
    );

    await recovery.updateOne(
      { _id: record._id },
      { $set: { used: true }}
    );

    return { success: true, message: "Password reset successful" };
  }
}

module.exports = Auth;
