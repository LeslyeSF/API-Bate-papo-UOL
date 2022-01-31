import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect(()=>{
  db = mongoClient.db("Bate-papo-UOL");
});

server.use(cors());
server.use(express.json());

const participantSchema = joi.object({
  name: joi.string().required(),
  lastStatus: joi.number()
});
const messageSchema = joi.object({
  from: joi.string(),
  to:joi.string(),
  text:joi.string(),
  type:joi.string(),
  time:joi.string()
});


server.post("/participants", async (req,res)=>{
  const user = {...req.body, lastStatus: Date.now()};

  const validation = participantSchema.validate(user, { abortEarly: true });

  if (validation.error) {
    res.status(422).send(validation.error.details[0].message);
  } 

  try{
    const participantsCollection = db.collection("participants");
    const listParticipants = await participantsCollection.find({name: user.name}).toArray();
    if(listParticipants.length > 0){
      res.sendStatus(409);
    } else{
      await participantsCollection.insertOne(user);
      const message = {
        from: user.name, 
        to: 'Todos', 
        text: 'entra na sala...', 
        type: 'status', 
        time: dayjs().format("HH:mm:ss")
      };
      const messageCollection = db.collection("messages");

      await messageCollection.insertOne(message);
      res.sendStatus(201);
    }
  }catch(err){
    res.status(500).send(err);
  }  
});

server.get("/participants", async (req,res)=>{
  try{
    const participantsCollection = db.collection("participants");
    const listParticipants = await participantsCollection.find({}).toArray();

    res.send(listParticipants);
    console.log("deu certo");
  }catch(err){
    res.status(500).send(err);
    console.log("falhou ge part");
    console.log(err);
  }
});

server.post("/messages", async (req,res)=>{
  
});

server.get("/messages", async (req,res)=>{
  
});

server.post("/status",async (req,res)=>{
  
});

server.listen(5000, ()=>{
  console.log("Running app in http://localhost:5000");
});



