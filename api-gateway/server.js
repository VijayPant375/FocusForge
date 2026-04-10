const express = require('express');
const cors = require('cors');
const axios = require('axios');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const USER_SERVICE = process.env.USER_SERVICE_URL;
const HABIT_SERVICE = process.env.HABIT_SERVICE_URL;
const ANALYTICS_SERVICE = process.env.ANALYTICS_SERVICE_URL;
const AI_SERVICE = process.env.AI_SERVICE_URL;

app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway is running' });
});

app.use('/api/users', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${USER_SERVICE}${req.path}`,
      data: req.body,
      headers: { authorization: req.headers.authorization }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'User service error'
    });
  }
});

app.use('/api/habits', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${HABIT_SERVICE}${req.path}`,
      data: req.body,
      headers: { authorization: req.headers.authorization }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Habit service error'
    });
  }
});

app.use('/api/analytics', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${ANALYTICS_SERVICE}${req.path}`,
      data: req.body,
      headers: { authorization: req.headers.authorization }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Analytics service error'
    });
  }
});

app.use('/api/ai', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${AI_SERVICE}${req.path}`,
      data: req.body,
      headers: { authorization: req.headers.authorization }
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'AI service error'
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
});
