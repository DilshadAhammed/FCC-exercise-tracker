require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
const usersSchema = new mongoose.Schema({
  username: String
});
const Users = mongoose.model('users', usersSchema);
const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, require: true},
  description: String,
  duration: Number,
  date: Date
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.urlencoded({extended: true}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req, res)=>{
  const userObj = new Users({
    username: req.body.username
  })
  try{
    let user = await userObj.save();
    // console.log(user);
    res.json(user);
  }catch(err){
    console.log(err);
  }
});

app.get('/api/users', async (req, res)=>{
  const users = await Users.find({}).select("_id username");
  if(!users){
    res.send(" no Users! ");
  }else{
    res.json(users);
  }
});

app.post('/api/users/:_id/exercises', async (req, res)=>{
  const {description, duration, date} = req.body;
  try{
    const user = await Users.findById(req.params._id)
    if(!user){
      res.send("Could not find user");
    }else{
      const exerciseObj = new Exercise({
        user_id: user.id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      });
      const exercise = await exerciseObj.save();
      res.json({
        _id: user.id,
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: new Date(exercise.date).toDateString()
      });
    }
  }catch(err){
    console.log(err);
  }
});
app.get('/api/users/:_id/logs', async (req, res)=>{
  const id = req.params._id;
  const {from, to, limit} = req.query;
  const user = await Users.findById(id).select('_id username');
  if(!user){
    res.send("could not find any user");
    return
  }
  let dateObj = {};
  if (from){
    dateObj["$gte"] = new Date(from);
  }
  if (to){
    dateObj["$lte"] = new Date(to);
  }
  let filter = {
    user_id: id
  };
  if(from || to){
    filter.date = dateObj
  }
  console.log(filter);
  const exerciseArray = await Exercise.find(filter).limit(+limit ?? 500);
  let count = exerciseArray.length;
  let log = exerciseArray.map(data =>({
    description: data.description,
    duration: data.duration,
    date: new Date(data.date).toDateString()
}));
  
  res.json({
    _id: user.id,
    username: user.username,
    count,
    log,
  });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
