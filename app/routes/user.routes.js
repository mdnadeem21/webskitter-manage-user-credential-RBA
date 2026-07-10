const express = require('express');
const {adminCheck, userCheck, authCheck} = require('../middleware/auth.check');
const UserController = require('../controller/user.controller');


const router=express.Router();

router.post('/admin/user/register', UserController.registerUser);
router.post('/verify-otp', UserController.verifyOtp);
router.post('/auth/login', UserController.loginUser);
router.get('/admin/users', authCheck,adminCheck, UserController.getAllUsers);
router.put('/admin/update/:id', authCheck,adminCheck, UserController.updateUser);
router.delete('/admin/delete/:id', authCheck, adminCheck, UserController.deleteUser);
router.put('/users/update-password/:id', authCheck, UserController.updatePassword); 
router.get('/users/profile/:id', authCheck,userCheck, UserController.getUserProfile);

router.post('/reset-password-link',UserController.resetPasswordLink);
router.post('/reset-password/:id/:token',UserController.resetPassword);

module.exports = router;