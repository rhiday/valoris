import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001; // Different port from Vite (5173)

// Middleware
app.use(cors());
app.use(express.json());

// Store the latest webhook data
let latestWebhookData = null;

// Webhook endpoint - Your colleague will POST data here
app.post('/api/webhook', (req, res) => {
  console.log('\n🎯 Received webhook data:', JSON.stringify(req.body, null, 2));
  
  // Store the data
  latestWebhookData = {
    ...req.body,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ Webhook data stored successfully');
  
  res.json({ 
    success: true, 
    message: 'Webhook data received',
    dataReceived: Object.keys(req.body),
    timestamp: new Date().toISOString()
  });
});

// Endpoint for your frontend to fetch the webhook data
app.get('/api/webhook-data', (req, res) => {
  console.log('📤 Frontend requesting webhook data...');
  
  if (!latestWebhookData) {
    return res.status(404).json({ 
      error: 'No webhook data available',
      message: 'Your colleague needs to send data to /api/webhook first'
    });
  }
  
  console.log('✅ Returning webhook data to frontend');
  res.json(latestWebhookData);
});

// Test endpoint to simulate your colleague's data
app.post('/api/test-webhook', (req, res) => {
  const testData = {
    vendors: [
      {
        "vendor": "Microsoft",
        "category": "Software",
        "annual_spend": 450000,
        "contract_end": "2025-12-31",
        "licenses": 500,
        "segment": "IT"
      },
      {
        "vendor": "Salesforce", 
        "category": "CRM",
        "annual_spend": 185000,
        "contract_end": "2025-03-31",
        "users": 300,
        "segment": "Sales"
      },
      {
        "vendor": "AWS",
        "category": "Cloud",
        "annual_spend": 320000,
        "contract_end": "2024-06-30",
        "segment": "IT"
      }
    ],
    source: "zapier_webhook",
    processed_at: new Date().toISOString()
  };
  
  // Store as if it came from real webhook
  latestWebhookData = testData;
  
  console.log('🧪 Test data stored');
  res.json({ success: true, message: 'Test data created', data: testData });
});

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    hasWebhookData: !!latestWebhookData,
    lastUpdate: latestWebhookData?.timestamp || null,
    endpoints: {
      'POST /api/webhook': 'Receive data from your colleague',
      'GET /api/webhook-data': 'Frontend fetches data',
      'POST /api/test-webhook': 'Create test data'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Webhook server running on http://localhost:${PORT}`);
  console.log(`\n📝 Tell your colleague to send data to:`);
  console.log(`   POST http://localhost:${PORT}/api/webhook`);
  console.log(`\n🧪 For testing, you can use:`);
  console.log(`   POST http://localhost:${PORT}/api/test-webhook`);
  console.log(`\n📊 Check status at:`);
  console.log(`   GET http://localhost:${PORT}/api/status`);
  console.log('\n');
});