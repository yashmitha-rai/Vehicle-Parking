const express = require("express");
const app= express();
const mongoConnection = require("./DB");
const cors = require("cors");
const routes = require("./routes/routes");
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/ContactRoutes');

//call the mongo connection function
mongoConnection();
console.log(">>> MODELS INITIALIZING <<<");
require('./models/ParkingSlot');

const PORT = 8008;
app.use(cors())

//middleware to read json
app.use(express.json());

//default route to check server status
app.listen(PORT, ()=>{
    console.log(`>>> BACKEND ACTIVE on port ${PORT} <<<`);
});

//test route
app.get("/", (req, res)=>{
    res.send("Server is up and running!");
});

//use routes
app.use("/api/auth", routes);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/user', userRoutes);
app.use("/api", contactRoutes);
//backend flow should be like this
//schemas/models -> controllers -> routes -> index.js (server.js/app.js)
//1. create schema/model (blueprint of collection) in models folder
//2. create controller to handle all the logic in controller folder
//3. create routes to define all the routes in routes folder
//4. bring all the routes in index.js (server.js/app.js) and use them as middleware