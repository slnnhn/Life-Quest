// Game State
let gameState = {
  player: {
    level: 1,
    xp: 0,
    totalXP: 0
  },
  mainQuests: [],
  sideQuests: [],
  achievements: [],
  stats: {
    questsCompleted: 0,
    mainQuestsCompleted: 0,
    sideQuestsCompleted: 0
  }
};

// XP requirements for each level
const XP_PER_LEVEL = 100;
const XP_MULTIPLIER = 1.5;

// Difficulty XP values
const DIFFICULTY_XP = {
  easy: 50,
  medium: 100,
  hard: 200,
  epic: 500
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_quest', title: 'First Steps', description: 'Complete your first quest', icon: '🎯', condition: (stats) => stats.questsCompleted >= 1 },
  { id: 'level_5', title: 'Rising Star', description: 'Reach level 5', icon: '⭐', condition: (state) => state.player.level >= 5 },
  { id: 'level_10', title: 'Legend', description: 'Reach level 10', icon: '👑', condition: (state) => state.player.level >= 10 },
  { id: 'quest_master', title: 'Quest Master', description: 'Complete 10 quests', icon: '🏆', condition: (stats) => stats.questsCompleted >= 10 },
  { id: 'main_quest_hero', title: 'Main Quest Hero', description: 'Complete 5 main quests', icon: '🦸', condition: (stats) => stats.mainQuestsCompleted >= 5 },
  { id: 'side_quest_specialist', title: 'Side Quest Specialist', description: 'Complete 10 side quests', icon: '🎖️', condition: (stats) => stats.sideQuestsCompleted >= 10 },
  { id: 'overachiever', title: 'Overachiever', description: 'Complete 50 quests', icon: '💎', condition: (stats) => stats.questsCompleted >= 50 }
];

// Current quest being edited
let currentQuestType = null;
let editingQuestId = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
  await loadGameState();
  initializeUI();
  setupEventListeners();
  renderAll();
});

// Load game state from Chrome storage
async function loadGameState() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['gameState'], (result) => {
      if (result.gameState) {
        gameState = result.gameState;
        // Ensure achievements array exists and has all current achievements
        if (!gameState.achievements || gameState.achievements.length === 0) {
          gameState.achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
        }
      } else {
        // Initialize achievements
        gameState.achievements = ACHIEVEMENTS.map(a => ({ ...a, unlocked: false }));
      }
      resolve();
    });
  });
}

// Save game state to Chrome storage
async function saveGameState() {
  return new Promise((resolve) => {
    chrome.storage.local.set({ gameState }, () => {
      resolve();
    });
  });
}

// Initialize UI
function initializeUI() {
  updatePlayerStats();
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add quest buttons
  document.getElementById('add-main-quest').addEventListener('click', () => openQuestModal('main'));
  document.getElementById('add-side-quest').addEventListener('click', () => openQuestModal('side'));

  // Modal close
  document.querySelector('.close').addEventListener('click', closeQuestModal);
  document.getElementById('cancel-modal').addEventListener('click', closeQuestModal);

  // Quest form submit
  document.getElementById('quest-form').addEventListener('submit', handleQuestSubmit);
}

// Switch tabs
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabName);
  });
}

// Open quest modal
function openQuestModal(type) {
  currentQuestType = type;
  editingQuestId = null;
  document.getElementById('modal-title').textContent = `Add New ${type === 'main' ? 'Main' : 'Side'} Quest`;
  document.getElementById('quest-form').reset();
  document.getElementById('quest-modal').classList.add('show');
}

// Edit quest
function editQuest(questId, isMainQuest) {
  console.log('Editing quest:', questId, 'isMain:', isMainQuest);

  const questList = isMainQuest ? gameState.mainQuests : gameState.sideQuests;
  const quest = questList.find(q => q.id === questId);

  if (!quest) {
    console.log('Quest not found for editing');
    return;
  }

  currentQuestType = isMainQuest ? 'main' : 'side';
  editingQuestId = questId;

  document.getElementById('modal-title').textContent = `Edit ${isMainQuest ? 'Main' : 'Side'} Quest`;
  document.getElementById('quest-title').value = quest.title;
  document.getElementById('quest-description').value = quest.description || '';
  document.getElementById('quest-category').value = quest.category;
  document.getElementById('quest-difficulty').value = quest.difficulty;
  document.getElementById('quest-deadline').value = quest.deadline || '';

  document.getElementById('quest-modal').classList.add('show');
  console.log('Edit modal opened');
}

// Close quest modal
function closeQuestModal() {
  document.getElementById('quest-modal').classList.remove('show');
  currentQuestType = null;
  editingQuestId = null;
}

// Handle quest form submission
async function handleQuestSubmit(e) {
  e.preventDefault();

  if (currentQuestType === 'main') {
    if (editingQuestId) {
      const index = gameState.mainQuests.findIndex(q => q.id === editingQuestId);
      const existingQuest = gameState.mainQuests[index];
      gameState.mainQuests[index] = {
        ...existingQuest,
        title: document.getElementById('quest-title').value,
        description: document.getElementById('quest-description').value,
        category: document.getElementById('quest-category').value,
        difficulty: document.getElementById('quest-difficulty').value,
        deadline: document.getElementById('quest-deadline').value,
        xp: DIFFICULTY_XP[document.getElementById('quest-difficulty').value]
      };
    } else {
      gameState.mainQuests.push({
        id: Date.now().toString(),
        title: document.getElementById('quest-title').value,
        description: document.getElementById('quest-description').value,
        category: document.getElementById('quest-category').value,
        difficulty: document.getElementById('quest-difficulty').value,
        deadline: document.getElementById('quest-deadline').value,
        completed: false,
        createdAt: Date.now(),
        xp: DIFFICULTY_XP[document.getElementById('quest-difficulty').value]
      });
    }
  } else {
    if (editingQuestId) {
      const index = gameState.sideQuests.findIndex(q => q.id === editingQuestId);
      const existingQuest = gameState.sideQuests[index];
      gameState.sideQuests[index] = {
        ...existingQuest,
        title: document.getElementById('quest-title').value,
        description: document.getElementById('quest-description').value,
        category: document.getElementById('quest-category').value,
        difficulty: document.getElementById('quest-difficulty').value,
        deadline: document.getElementById('quest-deadline').value,
        xp: DIFFICULTY_XP[document.getElementById('quest-difficulty').value]
      };
    } else {
      gameState.sideQuests.push({
        id: Date.now().toString(),
        title: document.getElementById('quest-title').value,
        description: document.getElementById('quest-description').value,
        category: document.getElementById('quest-category').value,
        difficulty: document.getElementById('quest-difficulty').value,
        deadline: document.getElementById('quest-deadline').value,
        completed: false,
        createdAt: Date.now(),
        xp: DIFFICULTY_XP[document.getElementById('quest-difficulty').value]
      });
    }
  }

  const questTitle = document.getElementById('quest-title').value;

  await saveGameState();
  renderAll();
  closeQuestModal();
  showNotification(`Quest "${questTitle}" ${editingQuestId ? 'updated' : 'added'}!`);
}

// Complete quest
async function completeQuest(questId, isMainQuest) {
  console.log('Completing quest:', questId, 'isMain:', isMainQuest);

  const questList = isMainQuest ? gameState.mainQuests : gameState.sideQuests;
  const quest = questList.find(q => q.id === questId);

  if (!quest || quest.completed) {
    console.log('Quest not found or already completed');
    return;
  }

  quest.completed = true;
  quest.completedAt = Date.now();

  // Award XP
  await addXP(quest.xp);

  // Update stats
  gameState.stats.questsCompleted++;
  if (isMainQuest) {
    gameState.stats.mainQuestsCompleted++;
  } else {
    gameState.stats.sideQuestsCompleted++;
  }

  console.log('Updated stats:', gameState.stats);
  console.log('Player level/XP:', gameState.player.level, gameState.player.xp);

  // Check achievements
  checkAchievements();

  await saveGameState();
  renderAll();
  showNotification(`Quest completed! +${quest.xp} XP`, 'success');
}

// Delete quest
async function deleteQuest(questId, isMainQuest) {
  console.log('Deleting quest:', questId, 'isMain:', isMainQuest);

  if (!confirm('Are you sure you want to delete this quest?')) {
    console.log('Delete cancelled by user');
    return;
  }

  if (isMainQuest) {
    gameState.mainQuests = gameState.mainQuests.filter(q => q.id !== questId);
  } else {
    gameState.sideQuests = gameState.sideQuests.filter(q => q.id !== questId);
  }

  console.log('Quest deleted');
  await saveGameState();
  renderAll();
  showNotification('Quest deleted', 'warning');
}

// Add XP and handle leveling
async function addXP(amount) {
  gameState.player.xp += amount;
  gameState.player.totalXP += amount;

  // Check for level up
  let leveledUp = false;
  while (gameState.player.xp >= getXPForNextLevel()) {
    gameState.player.xp -= getXPForNextLevel();
    gameState.player.level++;
    leveledUp = true;
  }

  if (leveledUp) {
    showNotification(`Level Up! You are now level ${gameState.player.level}!`, 'success');
    // Check achievements after leveling up
    checkAchievements();
  }

  updatePlayerStats();
}

// Get XP required for next level
function getXPForNextLevel() {
  return Math.floor(XP_PER_LEVEL * Math.pow(XP_MULTIPLIER, gameState.player.level - 1));
}

// Update player stats display
function updatePlayerStats() {
  document.getElementById('player-level').textContent = gameState.player.level;
  document.getElementById('player-xp').textContent = gameState.player.xp;
  const nextLevelXP = getXPForNextLevel();
  document.getElementById('next-level-xp').textContent = nextLevelXP;

  const xpPercentage = (gameState.player.xp / nextLevelXP) * 100;
  document.getElementById('xp-bar').style.width = `${xpPercentage}%`;
}

// Check and unlock achievements
function checkAchievements() {
  console.log('Checking achievements...');
  let newAchievements = [];

  gameState.achievements.forEach(achievement => {
    if (!achievement.unlocked) {
      try {
        // Try checking with stats first (for quest-based achievements)
        let unlocked = false;
        try {
          unlocked = achievement.condition(gameState.stats);
        } catch (e) {
          // If that fails, try with full game state (for level-based achievements)
          unlocked = achievement.condition(gameState);
        }

        if (unlocked) {
          console.log('Achievement unlocked:', achievement.title);
          achievement.unlocked = true;
          newAchievements.push(achievement);
        }
      } catch (error) {
        console.log('Error checking achievement:', achievement.id, error);
      }
    }
  });

  if (newAchievements.length > 0) {
    newAchievements.forEach(achievement => {
      showNotification(`Achievement Unlocked: ${achievement.title}!`, 'achievement');
    });
  }

  console.log('Achievements checked. New unlocks:', newAchievements.length);
}

// Attach event listeners to quest buttons and checkboxes
function attachQuestEventListeners() {
  // Checkboxes
  document.querySelectorAll('.quest-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const questId = e.target.dataset.questId;
      const isMain = e.target.dataset.isMain === 'true';
      await completeQuest(questId, isMain);
    });
  });

  // Edit buttons
  document.querySelectorAll('.btn-edit').forEach(button => {
    button.addEventListener('click', (e) => {
      const questId = e.target.dataset.questId;
      const isMain = e.target.dataset.isMain === 'true';
      editQuest(questId, isMain);
    });
  });

  // Delete buttons
  document.querySelectorAll('.btn-delete').forEach(button => {
    button.addEventListener('click', async (e) => {
      const questId = e.target.dataset.questId;
      const isMain = e.target.dataset.isMain === 'true';
      await deleteQuest(questId, isMain);
    });
  });
}

// Render all UI elements
function renderAll() {
  renderQuests('main');
  renderQuests('side');
  renderAchievements();
  updatePlayerStats();
}

// Render quests
function renderQuests(type) {
  const listId = type === 'main' ? 'main-quests-list' : 'side-quests-list';
  const questList = type === 'main' ? gameState.mainQuests : gameState.sideQuests;
  const container = document.getElementById(listId);

  if (questList.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${type === 'main' ? '🎯' : '📋'}</div>
        <div class="empty-state-text">No ${type} quests yet. Start your journey!</div>
      </div>
    `;
    return;
  }

  // Sort: incomplete first, then by creation date
  const sortedQuests = [...questList].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  container.innerHTML = sortedQuests.map(quest => `
    <div class="quest-item ${type}-quest ${quest.completed ? 'completed' : ''}" data-quest-id="${quest.id}" data-is-main="${type === 'main'}">
      <div class="quest-title-row">
        <input type="checkbox"
               class="quest-checkbox"
               ${quest.completed ? 'checked' : ''}
               data-quest-id="${quest.id}"
               data-is-main="${type === 'main'}"
               ${quest.completed ? 'disabled' : ''}>
        <div class="quest-title">${quest.title}</div>
        <div class="quest-xp">+${quest.xp} XP</div>
      </div>
      ${quest.description ? `<div class="quest-description">${quest.description}</div>` : ''}
      <div class="quest-meta">
        <span class="quest-category">${getCategoryIcon(quest.category)} ${formatCategory(quest.category)}</span>
        ${quest.deadline ? `<span class="quest-deadline">⏰ ${formatDate(quest.deadline)}</span>` : ''}
        <span class="quest-difficulty">${formatDifficulty(quest.difficulty)}</span>
      </div>
      ${!quest.completed ? `
        <div class="quest-actions">
          <button class="btn-edit" data-quest-id="${quest.id}" data-is-main="${type === 'main'}">Edit</button>
          <button class="btn-delete" data-quest-id="${quest.id}" data-is-main="${type === 'main'}">Delete</button>
        </div>
      ` : ''}
    </div>
  `).join('');

  // Add event listeners after rendering
  attachQuestEventListeners();
}

// Render achievements
function renderAchievements() {
  const container = document.getElementById('achievements-list');

  container.innerHTML = gameState.achievements.map(achievement => `
    <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
      <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
      <div class="achievement-title">${achievement.title}</div>
      <div class="achievement-description">${achievement.description}</div>
    </div>
  `).join('');
}

// Helper functions
function getCategoryIcon(category) {
  const icons = {
    health: '💪',
    career: '💼',
    relationships: '❤️',
    personal: '🌱',
    finance: '💰',
    hobbies: '🎨',
    other: '📌'
  };
  return icons[category] || '📌';
}

function formatCategory(category) {
  const names = {
    health: 'Health',
    career: 'Career',
    relationships: 'Relationships',
    personal: 'Personal',
    finance: 'Finance',
    hobbies: 'Hobbies',
    other: 'Other'
  };
  return names[category] || category;
}

function formatDifficulty(difficulty) {
  const symbols = {
    easy: '⭐',
    medium: '⭐⭐',
    hard: '⭐⭐⭐',
    epic: '⭐⭐⭐⭐'
  };
  return symbols[difficulty] || difficulty;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `${diffDays}d left`;
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;

  if (type === 'achievement') {
    notification.style.background = 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)';
    notification.style.color = '#333';
  } else if (type === 'warning') {
    notification.style.background = '#ff6b6b';
  }

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Functions are now attached via event listeners, no need for global exposure
