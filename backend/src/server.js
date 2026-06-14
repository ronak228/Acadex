const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const routes = require('./routes');
const { errorMiddleware } = require('./middleware/errorMiddleware');

const app = express();

// Security and utility middleware
app.use(helmet());

// CORS configuration: Allow frontend to request
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root API router aggregator
app.use('/api/v1', routes);

// Base route for health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date() });
});

// Centralized error handler
app.use(errorMiddleware);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});
