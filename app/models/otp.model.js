const mongoose=require("mongoose");

const OtpSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'manage-user-credential',
        required:true
    },
    otp:{
        type:String,
        required:true
    },
    createdAt:{
        type:Date,
        default:Date.now,
        expires:'15m' // OTP expires after 15 minutes 
    }
})

module.exports=mongoose.model("manage-user-otp",OtpSchema)