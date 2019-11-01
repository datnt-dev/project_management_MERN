const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TaskSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  },
  name: {
    type: String,
  },
  avatar: {
    type: String
  },
  project: {
    type: Schema.Types.ObjectId,
    ref: 'project'
  },
  project_name: {
    type: String,
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  from: {
    type: Date,
    required: true,
  },
  to: {
    type: Date,
    required: true
  },
  state: {
    type: String
  },
  comment: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'user'
      },
      name: {
        type: String,
      },
      avatar: {
        type: String
      },
      text: {
        type: String,
        required: true
      },
      date: {
        type: Date,
        default: Date.now
      }
    }
  ],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Task = mongoose.model('task', TaskSchema);
