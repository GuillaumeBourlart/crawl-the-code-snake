
// Fonction pour générer des items aléatoires
function generateRandomItems(count, worldSize) {
  const items = {};
  const itemColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', '#FFD133', '#8F33FF'];
  for (let i = 0; i < count; i++) {
    const id = `item-${i}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    items[id] = {
      id,
      x: Math.random() * worldSize.width,
      y: Math.random() * worldSize.height,
      value: Math.floor(Math.random() * 5) + 1,
      color: itemColors[Math.floor(Math.random() * itemColors.length)]
    };
  }
  return items;
}

// Dans votre fonction io.on('connection', (socket) => {...})
// Après avoir initialisé roomsData[roomId]

if (!roomsData[roomId]) {
  roomsData[roomId] = {
    players: {},
    items: generateRandomItems(50, { width: 2000, height: 2000 })
  };
}

// Initialiser le joueur avec les segments
roomsData[roomId].players[socket.id] = {
  x: Math.random() * 800,
  y: Math.random() * 600,
  length: 20,
  segments: [] // segments vides au début
};

// Envoyer l'état des items lors de la connexion
socket.join(roomId);
socket.emit('joined_room', { roomId });
io.to(roomId).emit('update_players', roomsData[roomId].players);
io.to(roomId).emit('update_items', roomsData[roomId].items);

// Dans l'événement 'move', ajouter la logique de collision:
socket.on('move', (data) => {
  let player = roomsData[roomId].players[socket.id];
  if (!player) return;
  
  // Ancienne position pour mettre à jour les segments
  const oldX = player.x;
  const oldY = player.y;
  
  player.x = data.x;
  player.y = data.y;
  
  // Mettre à jour les segments si le joueur en a
  if (!player.segments) player.segments = [];
  
  if (player.segments.length > 0) {
    // Déplacer tous les segments (le dernier prend la position du précédent, etc.)
    for (let i = player.segments.length - 1; i > 0; i--) {
      player.segments[i] = { ...player.segments[i-1] };
    }
    // Le premier segment prend l'ancienne position du joueur
    player.segments[0] = { x: oldX, y: oldY };
  }
  
  // Vérifier les collisions avec les items
  const playerSize = 20; // Taille du joueur
  const itemsToRemove = [];
  
  Object.entries(roomsData[roomId].items).forEach(([itemId, item]) => {
    const dx = player.x - item.x;
    const dy = player.y - item.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < playerSize + 10) { // Collision détectée
      // Ajouter un nouveau segment
      if (player.segments.length === 0) {
        // Premier segment à l'ancienne position du joueur
        player.segments.push({ x: oldX, y: oldY });
      } else {
        // Sinon, placer le nouveau segment après le dernier
        const lastSeg = player.segments[player.segments.length - 1];
        player.segments.push({ ...lastSeg });
      }
      
      itemsToRemove.push(itemId);
      
      // Notifier que l'item a été collecté
      io.to(roomId).emit('item_collected', { playerId: socket.id, itemId });
    }
  });
  
  // Supprimer les items collectés
  itemsToRemove.forEach(id => {
    delete roomsData[roomId].items[id];
  });
  
  // Ajouter de nouveaux items pour remplacer ceux collectés
  if (itemsToRemove.length > 0) {
    const newItems = generateRandomItems(itemsToRemove.length, { width: 2000, height: 2000 });
    roomsData[roomId].items = {
      ...roomsData[roomId].items,
      ...newItems
    };
    
    // Envoyer la mise à jour des items
    io.to(roomId).emit('update_items', roomsData[roomId].items);
  }
  
  // Envoyer les mises à jour des joueurs
  io.to(roomId).emit('update_players', roomsData[roomId].players);
});

// Fonction de boost déjà présente dans votre code
