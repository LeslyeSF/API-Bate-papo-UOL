import express from "express";
import cors from "cors";
import { ObjectId } from "mongodb";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();

const server = express();
const mongoClient = new MongoClient(process.env.MONGO_URI);
let db, userValidation="";
mongoClient.connect(()=>{
  db = mongoClient.db("Bate-papo-UOL");
});

server.use(cors());
server.use(express.json());

const participantSchema = joi.object({
  name: joi.string().required(),
  lastStatus: joi.number()
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
  const message = {
    from: req.headers.user,
    ...req.body,
    time: dayjs().format("HH:mm:ss")
  };

  try{
    let participants = await db.collection("participants").find({}).toArray();
    participants = participants.map((date)=>{return date.name});
    const messageSchema = joi.object({
      from: joi.string().valid(...participants).required(),
      to:joi.string().min(1).required(),
      text:joi.string().min(1).required(),
      type:joi.string().valid("private_message", "message").required(),
      time: joi.required()
    });
    const validation = messageSchema.validate(message, { abortEarly: true });
    if (validation.error) {
      res.status(422).send(validation.error.details[0].message);
    } 
    const messagesCollection = db.collection("messages");
    await messagesCollection.insertOne(message);
    

    res.sendStatus(201);
  } catch (err){
    res.status(500).send(err);
  }
  
});

server.get("/messages", async (req,res)=>{
  const limit = req.query.limit;
  try{
    const messagesCollection = db.collection("messages");
    let listMessages = await messagesCollection.find({}).toArray();
    listMessages = listMessages.filter(date => {
      if(date.type === "message" || date.from === req.headers.user || 
      date.to === req.headers.user || date.type === "status"){
        return true;
      } else{
        return false;
      }
    });
    if(limit){
      listMessages = listMessages.filter((date, index)=>{
        if(index > (listMessages.length-(parseInt(limit)+1))){
          return true;
        }
        return false;
      });
      res.send(listMessages);
    }else{
      res.send(listMessages);
    }
    
  }catch(err){
    res.status(500).send(err);
  }
  
  
});

server.post("/status",async (req,res)=>{
  const user = req.headers.user;
  try{
    const participantsCollection = db.collection("participants");
    const participant = await participantsCollection.findOne({name: user});
    if(participant){
      await participantsCollection.updateOne({
        _id: participant._id
      },{$set: { lastStatus: Date.now()}});
      res.sendStatus(200);
    } else{
      res.sendStatus(404);
    }
  }catch(err){
    res.status(500).send(err);
    console.log(err);
  }
});

server.delete("/messages/:idMessage", async(req, res)=>{
  const id = req.params.idMessage;
  const user = req.headers.user;
  try{
    const messagesCollection = db.collection("messages");
    const message = await messagesCollection.findOne({_id: new ObjectId(id)});
    if(message){
      if(message.from === user){
        await messagesCollection.deleteOne({_id: new ObjectId(id)});
        res.sendStatus(200);
      } else{
        res.sendStatus(401);
      }
    }else{
      res.sendStatus(404);
    }
  }catch(err){
    res.status(500).send(err);
    console.log(err);
  }
});

server.listen(5000, ()=>{
  console.log("Running app in http://localhost:5000");
});
updateUsers();
function updateUsers(){
  setInterval(async ()=>{
    try{
      const participantsCollection = db.collection("participants");
      let participants = await participantsCollection.find({lastStatus: {$lte: (Date.now()-10000)}}).toArray();
      if(participants.length > 0){
        participants = participants.map((date)=>{
          const message = {
            from: date.name, 
            to: 'Todos', 
            text: 'sai da sala...', 
            type: 'status', 
            time: dayjs().format("HH:mm:ss")
          };
          return message;
        });
        await participantsCollection.deleteMany({lastStatus: {$lte: (Date.now()-10000)}});
        const messagesCollection = db.collection("messages");
        await messagesCollection.insertMany([...participants]);
      } 
      
    }catch(err){
      console.log(err);
    }
    
  }, 5000);
}


