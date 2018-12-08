const express = require("express");
const morgan = require("morgan");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise


const app = express();

app.use(morgan("common"));
app.use(express.json());

const {PORT, DATABASE_URL} = require('./config');
const {BlogPosts} = require('./models');

//get endpoint
app.get('/blog-posts', (req, res) => {
  BlogPosts.find().then
    (blogposts => {
      res.json({
        blogposts: blogposts.map(blogposts => blogposts.serialize()) 
      })
    })
    .catch(err => {
      res.status(500).json({ message: "internal server error"})
    })
})

//post endpoint
app.post('/blog-posts', (req, res) => {
  const requiredFields = ["title", "content", "author"]
  for (let i=0; i<requiredFields.length; i++) {
    const field = requiredFields[i];
    if (!(field in req.body)) {
      const message = `missing \`${field}\` in request body`
      console.error(message)
      return res.status(400).send(message)
    }
  }

  BlogPosts.create({
    title: req.body.title,
    content: req.body.content,
    author: {
      firstName: req.body.author.firstName,
      lastName: req.body.author.lastName
    }
  })
  .then(blogposts => res.status(201).json(blogposts.serialize()))
  .catch(err => res.status(500).json({message: "internal server error"}))
})

//updating blog post by id
app.put("blog-posts/:id", (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    const message = "path id and body id must match"
    console.error(message)
    return res.status(400).json({message: message})
  }

  const toUpdate = {}
  const updateableFields = ["title", "author", "content"]
  updateableFields.forEach(field => {
    if (field in req.body) {
      toUpdate[field] = req.body[field]
    }
  })
  BlogPosts
  .findByIdAndUpdate(req.params.id, { $set: toUpdate })
  .then(post => res.status(204).end())
  .catch(err => res.status(500).json({ message: "Internal server error"}))
})

app.delete("/blog-posts/:id", (req, res) => {
  BlogPosts.findByIdAndRemove(req.params.id)
  .then(blogpost => res.status(204).end())
  .catch(err => res.status(500).json({message: "server error"}))
})


let server;

function runServer(databaseUrl, port=PORT) {
  return new Promise((resolve, reject) => {
    mongoose.connect(databaseUrl, err => {
      if (err) {
        return reject(err);
      }

      server = app.listen(port, () => {
        console.log(`Your app is listening on port ${port}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
    return new Promise((resolve, reject) => {
      console.log("Closing server");
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}



if (require.main === module) {
  runServer(DATABASE_URL).catch(err => console.error(err));
};


module.exports = { app, runServer, closeServer };
