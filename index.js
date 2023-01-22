const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true})
.then((result) => console.log('connected to mongodb'))
.catch((err) => console.log(err));

// Basic Configuration
const port = process.env.PORT || 3000;

//Schema for users
const user = mongoose.model('user', new mongoose.Schema({
    username: String,
    count: Number,
    log: [{
        date: Date,
        duration: Number,
        description: String
    }]
  }))

app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
    const username = req.body.username;
    user.findOne({username: username})
        .then((result) => {
            if (result) {
                res.json(result);
            } else {
                const newUser = new user({
                    username: username
                });
                newUser.save()
                    .then((result) => {
                        res.json({
                            username: result.username,
                            _id: result._id
                        });
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err);
                    });
            }
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
        });
})

app.get('/api/users', (req, res) => {
    user.find()
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            console.log(err);
        })
})

app.post('/api/users/:_id/exercises', (req, res) => {
    const userId = req.params._id;
    const noDate = new Date();
    
    user.findById(userId)
    .then(userDoc => {
        userDoc.log.push({ "duration": req.body.duration, "description": req.body.description, "date": req.body.date ? req.body.date : noDate.toISOString() });

        userDoc.count = userDoc.log.length;
        userDoc.save()
            .then((result) => {
                const reFormatDate = new Date(result.log[result.log.length-1].date);
                res.json({
                    username: result.username,
                    description: result.log[result.log.length-1].description,
                    duration: result.log[result.log.length-1].duration,
                    date: result.log[result.log.length-1].date ? reFormatDate.toDateString() : noDate.toDateString(),
                    _id: userId
                });
            })
            .catch((err) => {
                console.log(err);
                res.send("Id does not exist");
            })
    })
})

app.get("/api/users/:id/logs", (req, res) => {
    const { from, to, limit } = req.query;
    const {id} = req.params;

    user.findById(id, (err, userData) => {
      if(err || !userData) {
        res.send("Could not find user");
      }else{
        if(from || to) {
            let fromDate = new Date(0)
            let toDate = new Date()

            if(from) {
                fromDate = new Date(from)
            }

            if(to) {
                toDate = new Date(to)
            }

            fromDate = fromDate.getTime()
            toDate = toDate.getTime()

            userData.log = userData.log.filter((session) => {
                let sessionDate = new Date(session.date).getTime()
                let result = sessionDate >= fromDate && sessionDate <= toDate
                return result
            })
        }

        if(limit) {
            userData.log = userData.log.slice(0, limit)
        }
            userData.count = userData.log.length;
              res.json({
                username: userData.username,
                count: userData.count,
                _id: userData._id,
                log: userData.log.map((session) => {
                    return {
                        date: new Date(session.date).toDateString(),
                        duration: session.duration,
                        description: session.description
                        
                    }
                }) 
              })
            }
    })
  })


app.listen(port, () => console.log(`Listening on port ${port}`))


