const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// Database setup
const DB_PATH = path.join(__dirname, 'orders.json');

// Initialize database
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ orders: [] }, null, 2));
}

// API Routes
app.post('/api/orders', (req, res) => {
    try {
        const { clientName, street, number, neighborhood, priority, documents } = req.body;
        
        if (!clientName || !street || !number || !neighborhood || !priority) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let db = { orders: [] };
        try {
            const rawData = fs.readFileSync(DB_PATH);
            db = JSON.parse(rawData);
            if (!Array.isArray(db.orders)) {
                db.orders = [];
            }
        } catch (e) {
            console.error('Error reading orders file:', e);
            db = { orders: [] };
        }

        const newOrder = {
            id: Date.now().toString(),
            clientName,
            street,
            number,
            neighborhood,
            priority,
            documents: documents || [],
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        db.orders.push(newOrder);
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
        
        // Notify WebSocket clients
        if (wss) {
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'NEW_ORDER',
                        data: newOrder
                    }));
                }
            });
        }

        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error saving order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/orders', (req, res) => {
    try {
        const { role, status } = req.query;
        let db = { orders: [] };
        try {
            const rawData = fs.readFileSync(DB_PATH);
            db = JSON.parse(rawData);
            if (!Array.isArray(db.orders)) {
                db.orders = [];
            }
        } catch (e) {
            console.error('Error reading orders file:', e);
            db = { orders: [] };
        }
        
        let filteredOrders = [...db.orders];
        
        if (role === 'officeboy') {
            filteredOrders = filteredOrders.filter(order => order.status === 'pending');
        }
        
        if (status) {
            filteredOrders = filteredOrders.filter(order => order.status === status);
        }

        res.json(filteredOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.put('/api/orders/:id/status', (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const db = JSON.parse(fs.readFileSync(DB_PATH));
        const orderIndex = db.orders.findIndex(order => order.id === id);

        if (orderIndex === -1) {
            return res.status(404).json({ error: 'Order not found' });
        }

        db.orders[orderIndex].status = status;
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

        res.json(db.orders[orderIndex]);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start HTTP server
const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log('New WebSocket connection');
    
    ws.on('close', () => {
        console.log('WebSocket connection closed');
    });
});

// Route Optimization Algorithm
function calculateOptimalRoute(orders) {
    // Priority first (urgent > normal), then by proximity (simplified)
    const urgentOrders = orders.filter(o => o.priority === 'urgente');
    const normalOrders = orders.filter(o => o.priority === 'normal');
    
    return [...urgentOrders, ...normalOrders];
}

// Google Maps integration helper
function generateMapsUrl(orders) {
    const baseUrl = 'https://www.google.com/maps/dir/';
    const waypoints = orders.map(order => 
        `${order.street}+${order.number}+${order.neighborhood}`.replace(/\s+/g, '+')
    );
    return baseUrl + waypoints.join('/');
}
