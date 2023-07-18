const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose');
require('dotenv').config()


const Mongo_URI = process.env['MONGO_URI']
mongoose.connect(Mongo_URI, { useNewUrlParser: true, useUnifiedTopology: true });

let userData = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
    log: {
    type: [{
      description: {
        type: String,
      },
      duration: {
        type: Number,
      },
      date: {
        type: Date,
      }
    }],
  }
});

let userModel = mongoose.model('exerciseData', userData);

app.use(cors())
app.use(express.static('public'))

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', async (req,res) => {
try{
  const user = new userModel({
        username: req.body.username,
      });

      await user.save();
  res.json({username: req.body.username,_id:user._id})
  res.status(201)
}catch(err){
  res.status(500)
  console.log(err)
}
})

app.post('/api/users/:_id/exercises', async (req,res) => {
  try {
    let date 
    if (!req.body.date){
      date = new Date().toDateString()
    }else{
      date = new Date(req.body.date).toDateString()
    }
    let user = await userModel.findById(req.params._id).exec()
    user.log.push({description: req.body.description,
                  duration: parseInt(req.body.duration),
                 date: date})
    await user.save()
    res.json({_id:user._id, username: user.username, date: date ,duration:parseInt(req.body.duration), description: req.body.description})
  res.status(201)
  }catch(err){
    res.status(500)
    console.log(err)
  }
} )


//Endpoint to get users list
app.get('/api/users', async (req,res) => {
  let userList
  userList = await userModel.find({},'_id username __v').exec()
  res.json(userList)
})

app.get('/api/users/:_id/logs', async (req, res) => {
  try {
    const { from, to, limit } = req.query;
    let user = await userModel.findById(req.params._id).exec();

    const parsedLimit = limit ? parseInt(limit) : null;

    let filteredLogs;
//Check if parameters are passed
    if (from && !to) {
      filteredLogs = user.log.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= new Date(from);
      });
    } else if (to && !from) {
      filteredLogs = user.log.filter(log => {
        const logDate = new Date(log.date);
        return logDate <= new Date(to);
      });
    } else if (from && to) {
      filteredLogs = user.log.filter(log => {
        const logDate = new Date(log.date);
        return logDate >= new Date(from) && logDate <= new Date(to);
      });
    } else {
      filteredLogs = user.log.filter(log => {
        const logDate = new Date(log.date);
        return true;
      });
    }

    let limitedLogs;

    if (parsedLimit) {
      limitedLogs = filteredLogs.slice(0, parsedLimit);
    } else {
      limitedLogs = filteredLogs;
    }

const logs = limitedLogs.map(key => ({
  'description': key.description,
  'duration': key.duration,
  'date': key.date.toDateString()
}));


    const userJson = user.toJSON(); // Convert the Mongoose document to a JSON object
    userJson['log'] = logs;
    userJson['count'] = logs.length;
    res.json(userJson);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
