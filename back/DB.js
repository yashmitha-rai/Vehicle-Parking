const mongoose = require('mongoose');
const mongoURL = "mongodb://localhost:27017/parking"; //path of your mongoDB database

const mongodbconnection = async()=>{
    try{
        const conn = await mongoose.connect(mongoURL);
        console.log("MongoDB connected successfully");
    }
    catch(err){
        console.log("Error in MongoDB connection", err);
    }
}

module.exports = mongodbconnection;