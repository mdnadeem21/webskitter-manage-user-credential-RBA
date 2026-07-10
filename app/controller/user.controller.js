const User = require('../models/user.model');
const OtpModel = require('../models/otp.model');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const transporter = require('../config/emailConfig');
// const sendEmail = require('../utils/sendEmail');
const sendOtp = require('../utils/sendOtp');


class UserController {
    async registerUser(req, res) {
        try {
            const { name, email, password, phone, department, role } = req.body;

            if (!name || !email || !password || !phone || !department || !role) {
                return res.status(400).json({
                    status: false,
                    message: 'All fields are required'
                });
            }
            const userExist = await User.findOne({ email });
            if (userExist) {
                console.log('user already exist');
                return res.status(400).json({
                    status: false,
                    message: 'User already exists'
                });
            }

            const salt = await bcryptjs.genSalt(10);
            const hashPassword = await bcryptjs.hash(password, salt);

            const userdata = new User({
                name,
                email,
                phone,
                department,
                role,
                password: hashPassword,
            });

            const data = await userdata.save();

            // Send OTP email
            // await sendEmail(req, user);
            await sendOtp(req, userdata);
            return res.status(200).json({
                status: true,
                message: "User registered successfully and email sent to email for login and update password.",
                data: data,
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in register user' });
        }
    }

    async verifyOtp(req, res) {

        try {
            const { email, otp } = req.body;

            if (!email || !otp) {
                return res.status(400).json({ status: false, message: "All fields are required" });
            }
            const existingUser = await User.findOne({ email });

            // Check if email doesn't exists
            if (!existingUser) {
                return res.status(404).json({ status: "failed", message: "Email doesn't exists" });
            }

            // Check if email is already verified
            if (existingUser.isVerified) {
                return res.status(400).json({ status: false, message: "Email is already verified" });
            }
            // Check if there is a matching email verification OTP
            const emailVerification = await OtpModel.findOne({ userId: existingUser._id, otp });
            if (!emailVerification) {
                if (!existingUser.isVerified) {
                    await sendOtp(req, existingUser);
                    return res.status(400).json({ status: false, message: "Invalid OTP, new OTP sent to your email" });
                }
                return res.status(400).json({ status: false, message: "Invalid OTP" });
            }
            // Check if OTP is expired
            const currentTime = new Date();
            // 15 * 60 * 1000 calculates the expiration period in milliseconds(15 minutes).
            const expirationTime = new Date(emailVerification.createdAt.getTime() + 15 * 60 * 1000);
            if (currentTime > expirationTime) {
                // OTP expired, send new OTP
                await sendOtp(req, existingUser);
                return res.status(400).json({ status: "failed", message: "OTP expired, new OTP sent to your email" });
            }
            // OTP is valid and not expired, mark email as verified
            existingUser.isVerified = true;
            await existingUser.save();

            // Delete email verification document
            await OtpModel.deleteMany({ userId: existingUser._id });
            return res.status(200).json({ status: true, message: "Email verified successfully" });


        } catch (error) {
            console.error(error);
            res.status(500).json({ status: false, message: "Unable to verify email, please try again later" });
        }

    }
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                return res.status(400).json({
                    status: false,
                    message: 'Email and password are required'
                });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid email or password'
                });
            }
            const isMatch = await bcryptjs.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    status: false,
                    message: 'Invalid email or password'
                });
            }
            const token = jwt.sign({
                id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                department: user.department,
                role: user.role

            }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
            res.status(200).json({
                status: true,
                message: 'Login successful',
                user: user,
                token: token
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in login user' });
        }
    }

    async getAllUsers(req, res) {
        try {
            const users = await User.find();
            if (!users || users.length === 0) {
                return res.status(404).json({
                    status: false,
                    message: 'No users found'
                });
            }
            res.status(200).json({
                status: true,
                message: 'Users fetched successfully',
                data: users
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in get all users' });
        }
    }

    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { name, email, phone, department, role } = req.body;
            const user = await User.findByIdAndUpdate(id, { name, email, phone, department, role }, { new: true });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }
            res.status(200).json({
                status: true,
                message: 'User updated successfully',
                data: user
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in update user' });
        }
    }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByIdAndDelete(id);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }
            res.status(200).json({
                status: true,
                message: 'User deleted successfully',
                data: user
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in delete user' });
        }
    }

    async updatePassword(req, res) {
        try {
            const { id } = req.params;
            const { oldPassword, newPassword } = req.body;
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }

            if (!newPassword || !oldPassword) {
                return res.status(400).json({
                    status: false,
                    message: 'Both old and new passwords are required'
                });
            }
            const user = await User.findById(id);

            const isMatch = await bcryptjs.compare(oldPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    status: false,
                    message: 'Old password is incorrect'
                });
            }
            const salt = await bcryptjs.genSalt(10);
            const hashPassword = await bcryptjs.hash(newPassword, salt);
            const updatedUser = await User.findByIdAndUpdate(id, { password: hashPassword }, { new: true });
            res.status(200).json({
                status: true,
                message: 'Password updated successfully',
                data: updatedUser
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in update password' });
        }
    }

    async getUserById(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }
            res.status(200).json({
                status: true,
                message: 'User fetched successfully',
                data: user
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in get user by id' });
        }
    }

    async getUserProfile(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'User not found'
                });
            }
            res.status(200).json({
                status: true,
                message: 'User profile fetched successfully',
                data: user
            });
        } catch (err) {
            console.log(err);
            res.status(500).json({ status: false, message: 'Server error in get user profile' });
        }
    }

    async resetPasswordLink(req, res) {
        try {
            const { email } = req.body;
            if (!email) {
                return res.status(400).json({ status: false, message: "Email field is required" });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ status: false, message: "Email doesn't exist" });
            }
            // Generate token for password reset
            const secret = user._id + process.env.JWT_SECRET;
            const tokenLink = jwt.sign({ userID: user._id }, secret, { expiresIn: '20m' });
            // Reset Link and this link generate by frontend developer
            const resetLink = `${process.env.FRONTEND_HOST}/account/reset-password-confirm/${user._id}/${tokenLink}`;
            //console.log(resetLink);
            // Send password reset email  
            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: user.email,
                subject: "Password Reset Link",
                html: `<p>Hello ${user.name},</p><p>Please <a href="${resetLink}">Click here</a> to reset your password.</p>`
            });
            // Send success response
            res.status(200).json({ status: true, message: "Password reset link sent to your email. Please check your email." });

        } catch (error) {
            console.log(error);
            res.status(500).json({ status: false, message: "Unable to send password reset email. Please try again later." });

        }

    }

    async resetPassword(req, res) {
        try {
            const { password, confirm_password } = req.body;
            const { id, token } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(400).json({ status: false, message: "User not found" });
            }
            // Validate token check 
            const new_secret = user._id + process.env.JWT_SECRET;
            jwt.verify(token, new_secret);

            if (!password || !confirm_password) {
                return res.status(400).json({ status: false, message: "New Password and Confirm New Password are required" });
            }

            if (password !== confirm_password) {
                return res.status(400).json({ status: false, message: "New Password and Confirm New Password don't match" });
            }
            // Generate salt and hash new password
            const salt = await brctpyjs.genSalt(10);
            const newHashPassword = await brctpyjs.hash(password, salt);

            // Update user's password
            await User.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } });

            // Send success response
            res.status(200).json({ status: "success", message: "Password reset successfully" });

        } catch (error) {
            return res.status(500).json({ status: "failed", message: "Unable to reset password. Please try again later." });
        }
    }

}

module.exports = new UserController();