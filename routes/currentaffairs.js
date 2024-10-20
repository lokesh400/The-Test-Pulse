const express = require("express");
const router = express.Router();
const Blog = require('../models/Blog');


app.get('/currentaffairs/create/new', (req,res) => {
    res.render('listings/create');
  })
  
  // Route to handle submitted data
  app.post('/submit-data', async (req, res) => {
      const { data } = req.body;
      if (Array.isArray(data)) {
          try {
  
            var d = new Date();
            const date = d.getDate();
            const month = d.getMonth();
            const y = d.getYear();
            const year = y-100;
            const newData = new DataModel({ 
              text: data,
              date:date,
              month:month,
              year:year
          });
          await newData.save();
              res.status(200).send('Data submitted');
          } catch (error) {
              console.error('Error saving data:', error);
              res.status(500).send('Error saving data');
          }
      } else {
          res.status(400).send('Invalid data format');
      }
      console.log(data)
  });
  
  app.get('/currentaffairs', async (req, res) => {
    const allListing = await DataModel.find({});
    res.render('./listings/showall',{allListing});
  });
  
  app.post('/get/currentaffair/by/month', async (req, res) => {
    var selectedOption = req.body.selectedOption;
    const allListing = await DataModel.find({month : selectedOption});
    res.render('./listings/show',{allListing});
  });