import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);

server.use(cors());
server.use(express.json());

server.post("/participants", (req,res)=>{});
server.get("/participants", (req,res)=>{});

server.post("/messages", (req,res)=>{});
server.get("/messages", (req,res)=>{});

server.post("/status", (req,res)=>{});

server.listen(5000, ()=>{
  console.log("Running app in http://localhost:5000");
});
