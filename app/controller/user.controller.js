const User = require('../models/user.model');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail  = require('../config/emailConfig');


class UserController {
    async registerUser(req,res){
    try{
        const {name,email,password,phone,department,role}=req.body;

        if(!name || !email || !password || !phone || !department || !role) {
            return res.status(400).json({
                status:false,
                message:'All fields are required'});
        }
        const userExist = await User.findOne({ email });
            if (userExist) {
                console.log('user already exist');
                return res.status(400).json({
                    status:false,
                    message:'User already exists'
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
            await sendEmail(req, user);
            return res.status(200).json({
                status: true,
                message: "User registered successfully and email sent to email for login and update password.",
                data: data,
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in register user'});
        }
    }

    async loginUser(req,res){
        try{
            const {email,password}=req.body;
            if(!email || !password){
                return res.status(400).json({
                    status:false,
                    message:'Email and password are required'
                });
            }
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({
                    status:false,
                    message:'Invalid email or password'
                });
            }
            const isMatch = await bcryptjs.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    status:false,
                    message:'Invalid email or password'
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
                status:true,
                message:'Login successful',
                user:user,
                token:token
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in login user'});
        }
    }

    async getAllUsers(req,res){
        try{
            const users = await User.find();
            if(!users || users.length === 0){
                return res.status(404).json({
                    status:false,
                    message:'No users found'
                });
            } 
            res.status(200).json({
                status:true,
                message:'Users fetched successfully',
                data:users
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in get all users'});
        }
    }

    async updateUser(req,res){
        try{
            const {id} = req.params;
            const {name, email, phone, department, role} = req.body;
            const user = await User.findByIdAndUpdate(id, {name, email, phone, department, role}, {new:true});
            if(!user){
                return res.status(404).json({
                    status:false,
                    message:'User not found'
                });
            }
            res.status(200).json({
                status:true,
                message:'User updated successfully',
                data:user
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in update user'});
        }
    }

    async deleteUser(req,res){
        try{
            const {id} = req.params;
            const user = await User.findByIdAndDelete(id);
            if(!user){
                return res.status(404).json({
                    status:false,
                    message:'User not found'
                });
            }
            res.status(200).json({
                status:true,
                message:'User deleted successfully',
                data:user
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in delete user'});
        }
    }

    async updatePassword(req,res){
        try{
            const {id} = req.params;
             const {oldPassword, newPassword} = req.body;
            if(!user){
                return res.status(404).json({
                    status:false,
                    message:'User not found'
                });
            }
           
            if(!newPassword || !oldPassword){
                return res.status(400).json({
                    status:false,
                    message:'Both old and new passwords are required'
                });
            }
            const user = await User.findById(id);
            
            const isMatch = await bcryptjs.compare(oldPassword, user.password);
            if(!isMatch){
                return res.status(400).json({
                    status:false,
                    message:'Old password is incorrect'
                });
            }
            const salt = await bcryptjs.genSalt(10);
            const hashPassword = await bcryptjs.hash(newPassword, salt);
            const updatedUser = await User.findByIdAndUpdate(id, {password:hashPassword}, {new:true});
            res.status(200).json({
                status:true,
                message:'Password updated successfully',
                data:updatedUser
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in update password'});
        }
    }

    async getUserById(req,res){
        try{
            const {id} = req.params;
            const user = await User.findById(id);
            if(!user){
                return res.status(404).json({
                    status:false,
                    message:'User not found'
                });
            }
            res.status(200).json({
                status:true,
                message:'User fetched successfully',
                data:user
            });
        }catch(err){
            console.log(err);
            res.status(500).json({status:false,message:'Server error in get user by id'});
        }
    }

}