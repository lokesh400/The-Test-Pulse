const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name:{
    type:String,
  },
  college:{
    type:String,
  },
  subject:{
    type:String
  },
  photo:{
    type:String,
  }
});

const Team = mongoose.model('Team', TeamSchema);

module.exports = Team;