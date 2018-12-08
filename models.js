"use strict"

const mongoose = require('mongoose')
mongoose.Promise = global.Promise

//schema to represent a blog post
const blogSchema = mongoose.Schema({
  title: { type: String, required: true },
  author: { 
    firstName: String,
    lastName: String
   },
  content: {type: String, required: true }
})

blogSchema.virtual("authorString").get(function(){
  return `${this.author.firstName} ${this.author.lastName}`.trim()
})

blogSchema.methods.serialize = function() {
  return {
    id: this._id,
    title: this.title,
    content: this.content,
    author: this.authorString,
    created: this.created
  }
}

const BlogPosts = mongoose.model("Blog-Posts", blogSchema)

module.exports = { BlogPosts }
