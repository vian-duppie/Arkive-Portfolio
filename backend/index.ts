import express, { Express } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

// Routes
import itemRoutes  from './routes/itemRoutes';
import userRoutes from './routes/userRoutes';
import locationRoutes from './routes/locationRoutes';

dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Environment Variables
const port = process.env.PORT || 3000;
const cluster = process.env.CLUSTER;

// Connection To The Database
mongoose.connect(cluster!)
.then(() => {
    console.log("Connection to server successful")
})
.catch((err) => {
    console.log(err)
})

// Endpoints
app.use(itemRoutes)
app.use(userRoutes)
app.use(locationRoutes)

// Listener
app.listen(port, () => {
    console.log(`The Server is now running on Port: ${port}`)
})