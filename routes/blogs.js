const express = require("express");
const router = express.Router();
const Blog = require('../models/Blog');



router.get('/new', (req,res) => {
    res.render('./listings/blogs/createblogs.ejs');
  });
  
router.post('/new', async (req, res) => {
    const { date,title,event } = req.body;
          const title2 = title.toString();
          const event2 = event.toString();
          const newBlog = new Blog({ 
            date:date,
            title:title2,
            event:event2
        });
        await newBlog.save();
        res.send("Data Saved");
  });
  
router.get('/show', async (req, res) => {
    const allBlogs = await Blog.find({});
    res.render('./listings/blogs/showallblogs',{allBlogs});
  });
  
router.get('/show/all/:id', async (req, res) => {
    const {id} = req.params;
    const allBlogs = await Blog.findById(id);
    res.render("./listings/blogs/showblog.ejs",{allBlogs});
  });
  
module.exports = router;  