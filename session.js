const mongoose = require('mongoose');


const sessionSchema = new mongoose.Schema({

    session_id: {type: String, required: true},
    
})


module.exports = mongoose.model('Session', sessionSchema);