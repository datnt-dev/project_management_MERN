const express = require('express');
const connectDB = require('./config/db');

const app = express();

// Connect DB
connectDB();

app.use(express.json({extended: false}));

app.get('/', (req, res) => res.send('API Running'));

app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/projects', require('./routes/api/projects'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
