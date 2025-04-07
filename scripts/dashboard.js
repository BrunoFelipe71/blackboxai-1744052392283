let map;
let directionsService;
let directionsRenderer;
let orders = [];
let markers = [];
let currentRoute = null;

// Initialize Map with real geocoding
function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -23.5505, lng: -46.6333 },
        zoom: 12
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#3b82f6',
            strokeWeight: 5
        }
    });

    // Add route control panel
    const controlPanel = document.createElement('div');
    controlPanel.className = 'bg-white p-4 rounded-lg shadow-md mb-4';
    controlPanel.innerHTML = `
        <h3 class="font-bold mb-2">Opções de Rota</h3>
        <button id="optimizeRoute" class="bg-blue-500 text-white px-3 py-1 rounded mr-2">
            <i class="fas fa-route mr-1"></i>Otimizar Automaticamente
        </button>
        <button id="manualRoute" class="bg-green-500 text-white px-3 py-1 rounded">
            <i class="fas fa-hand-pointer mr-1"></i>Selecionar Manualmente
        </button>
        <div id="routeInfo" class="mt-2 text-sm"></div>
    `;
    map.controls[google.maps.ControlPosition.TOP_CENTER].push(controlPanel);

    loadOrders();
    setupEventListeners();
}

// Load orders from API
async function loadOrders() {
    try {
        const response = await fetch('/api/orders?role=officeboy');
        orders = await response.json();
        renderOrdersList();
        updateMapMarkers();
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Erro ao carregar pedidos', 'error');
    }
}

// Render orders list
function renderOrdersList() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = '';

    if (orders.length === 0) {
        ordersList.innerHTML = '<p class="text-gray-500">Nenhum pedido pendente</p>';
        return;
    }

    orders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = `p-3 rounded-lg border ${order.priority === 'urgente' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`;
        orderElement.dataset.id = order.id;
        orderElement.draggable = true;
        
        orderElement.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-medium">${order.clientName}</h3>
                    <p class="text-sm text-gray-600">${order.street}, ${order.number} - ${order.neighborhood}</p>
                    ${order.documents.length > 0 ? 
                        `<p class="text-xs mt-1"><span class="font-medium">Documentos:</span> ${order.documents.join(', ')}</p>` : ''}
                </div>
                <span class="px-2 py-1 text-xs rounded-full ${order.priority === 'urgente' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                    ${order.priority === 'urgente' ? 'Urgente' : 'Normal'}
                </span>
            </div>
        `;

        ordersList.appendChild(orderElement);
    });
}

// Update map markers
function updateMapMarkers() {
    // Clear existing markers
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    // Add new markers
    orders.forEach(order => {
        const marker = new google.maps.Marker({
            position: { lat: getRandomLatLng().lat, lng: getRandomLatLng().lng }, // Placeholder - would use geocoding
            map: map,
            title: `${order.clientName} - ${order.street}, ${order.number}`,
            icon: {
                url: order.priority === 'urgente' ? 
                    'https://maps.google.com/mapfiles/ms/icons/red-dot.png' :
                    'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                scaledSize: new google.maps.Size(32, 32)
            }
        });
        markers.push(marker);
    });
}

// Calculate optimized route automatically
function calculateOptimizedRoute() {
    if (orders.length === 0) return;

    const waypoints = orders.map(order => ({
        location: new google.maps.LatLng(
            -23.55 + (Math.random() * 0.1 - 0.05), // Simulated coordinates
            -46.63 + (Math.random() * 0.1 - 0.05)  // Would use Geocoding API in production
        ),
        stopover: true
    }));

    directionsService.route({
        origin: waypoints[0].location,
        destination: waypoints[waypoints.length - 1].location,
        waypoints: waypoints.slice(1, -1),
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        provideRouteAlternatives: true
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            currentRoute = response;
            showRouteInfo(response.routes[0]);
        } else {
            console.error('Directions request failed:', status);
            showAlert('Erro ao calcular rota otimizada', 'error');
        }
    });
}

// Manual route selection
function setupManualRouteSelection() {
    let selectedOrders = [];
    
    // Clear existing listeners
    markers.forEach(marker => {
        google.maps.event.clearInstanceListeners(marker);
    });

    // Add click handlers to markers
    markers.forEach(marker => {
        marker.addListener('click', () => {
            const orderId = marker.get('orderId');
            const order = orders.find(o => o.id === orderId);
            
            if (selectedOrders.includes(orderId)) {
                // Deselect
                selectedOrders = selectedOrders.filter(id => id !== orderId);
                marker.setIcon({
                    url: order.priority === 'urgente' ? 
                        'https://maps.google.com/mapfiles/ms/icons/red-dot.png' :
                        'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                    scaledSize: new google.maps.Size(32, 32)
                });
            } else {
                // Select
                selectedOrders.push(orderId);
                marker.setIcon({
                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    scaledSize: new google.maps.Size(40, 40)
                });
            }
            
            if (selectedOrders.length >= 2) {
                calculateManualRoute(selectedOrders);
            }
        });
    });
    
    showAlert('Selecione no mínimo 2 entregas no mapa', 'info');
}

function calculateManualRoute(selectedOrderIds) {
    const selectedOrders = orders.filter(o => selectedOrderIds.includes(o.id));
    
    const waypoints = selectedOrders.map(order => ({
        location: new google.maps.LatLng(
            -23.55 + (Math.random() * 0.1 - 0.05), // Simulated coordinates
            -46.63 + (Math.random() * 0.1 - 0.05)  // Would use Geocoding API in production
        ),
        stopover: true
    }));

    directionsService.route({
        origin: waypoints[0].location,
        destination: waypoints[waypoints.length - 1].location,
        waypoints: waypoints.slice(1, -1),
        travelMode: google.maps.TravelMode.DRIVING
    }, (response, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(response);
            currentRoute = response;
            showRouteInfo(response.routes[0]);
        } else {
            console.error('Directions request failed:', status);
            showAlert('Erro ao calcular rota manual', 'error');
        }
    });
}

function showRouteInfo(route) {
    const distance = route.legs.reduce((sum, leg) => sum + leg.distance.value, 0) / 1000;
    const duration = route.legs.reduce((sum, leg) => sum + leg.duration.value, 0) / 60;
    
    document.getElementById('routeInfo').innerHTML = `
        <p><strong>Distância total:</strong> ${distance.toFixed(1)} km</p>
        <p><strong>Tempo estimado:</strong> ${Math.round(duration)} minutos</p>
    `;
}

function setupEventListeners() {
    document.getElementById('optimizeRoute').addEventListener('click', calculateOptimizedRoute);
    document.getElementById('manualRoute').addEventListener('click', setupManualRouteSelection);
    
    document.getElementById('startRoute').addEventListener('click', () => {
        if (!currentRoute) {
            showAlert('Calcule a rota primeiro', 'error');
            return;
        }
        showAlert('Rota iniciada! Atualizando status das entregas...', 'success');
        
        // Update status of all orders in the route
        currentRoute.request.waypoints.forEach(waypoint => {
            const order = orders.find(o => 
                `${o.street}, ${o.number}, ${o.neighborhood}` === waypoint.location
            );
            if (order) {
                updateOrderStatus(order.id, 'in_progress');
            }
        });
    });

    // Drag and drop for reordering
    const ordersList = document.getElementById('ordersList');
    new Sortable(ordersList, {
        animation: 150,
        onEnd: () => {
            const newOrder = Array.from(ordersList.children).map(el => 
                orders.find(o => o.id === el.dataset.id)
            );
            orders = newOrder;
            updateMapMarkers();
        }
    });
}

async function updateOrderStatus(orderId, status) {
    try {
        const response = await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update status');
        }
    } catch (error) {
        console.error('Error updating order status:', error);
    }
}

// Helper functions
function getRandomLatLng() {
    // Placeholder - would use real geocoding
    return {
        lat: -23.5505 + (Math.random() * 0.1 - 0.05),
        lng: -46.6333 + (Math.random() * 0.1 - 0.05)
    };
}

function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `fixed top-4 right-4 px-4 py-2 rounded-md shadow-md ${
        type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
    }`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 3000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initMap();
});
