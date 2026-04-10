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

const forwardRequest = async (serviceUrl, req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.path}`,
      data: req.body,
      headers: { authorization: req.headers.authorization },
      timeout: 8000 // 8 second timeout
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(`Gateway Error [${serviceUrl}]:`, error.message);
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({ error: 'Service Timeout - Please try again later' });
    }
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ error: 'Service Offline - Maintenance in progress' });
    }
    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal Gateway Error'
    });
  }
};

app.use('/api/users', (req, res) => forwardRequest(USER_SERVICE, req, res));
app.use('/api/habits', (req, res) => forwardRequest(HABIT_SERVICE, req, res));
app.use('/api/analytics', (req, res) => forwardRequest(ANALYTICS_SERVICE, req, res));
app.use('/api/ai', (req, res) => forwardRequest(AI_SERVICE, req, res));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ API Gateway running on port ${PORT}`);
});
