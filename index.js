require('dotenv').config()
const express=require("express")
const path=require('path')
const cors=require('cors')
const cookieParser=require('cookie-parser')
const connectDB = require('./app/config/db')
const userRoutes = require('./app/routes/user.routes')

connectDB()
const app = express()

//cors
app.use(cors())
app.use(cookieParser())
//middleware
app.use(express.json());
app.use(express.urlencoded({extended:false}))
 
app.use('/api', userRoutes)


const PORT=process.env.PORT||3005
app.listen(PORT, (error) =>{
    if(error){
        console.log(error);
    }else{
        console.log("server is running on port ",`http://localhost:${PORT}`);
    }
})