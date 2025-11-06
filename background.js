// Background service worker for Life Quest

// Helper function to safely create notifications
function safeCreateNotification(options) {
  if (chrome.notifications) {
    try {
      chrome.notifications.create('', options, (notificationId) => {
        if (chrome.runtime.lastError) {
          console.log('Notification error:', chrome.runtime.lastError);
        }
      });
    } catch (error) {
      console.log('Notification not supported:', error);
    }
  }
}

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Life Quest installed!');
    // Show welcome notification
    safeCreateNotification({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Welcome to Life Quest!',
      message: 'Start your journey by adding your first quest. Level up your life!',
      priority: 2
    });
  }
});

// Check for quest deadlines daily
chrome.alarms.create('checkDeadlines', {
  periodInMinutes: 60 // Check every hour
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkDeadlines') {
    checkQuestDeadlines();
  }
});

// Check quest deadlines and send notifications
async function checkQuestDeadlines() {
  chrome.storage.local.get(['gameState'], (result) => {
    if (!result.gameState) return;

    const gameState = result.gameState;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allQuests = [...gameState.mainQuests, ...gameState.sideQuests];

    allQuests.forEach(quest => {
      if (quest.completed || !quest.deadline) return;

      const deadline = new Date(quest.deadline);
      deadline.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      // Notify for quests due today or tomorrow
      if (diffDays === 0) {
        safeCreateNotification({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Quest Due Today!',
          message: `"${quest.title}" is due today. Complete it to earn ${quest.xp} XP!`,
          priority: 2
        });
      } else if (diffDays === 1) {
        safeCreateNotification({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Quest Due Tomorrow',
          message: `"${quest.title}" is due tomorrow. Don't forget!`,
          priority: 1
        });
      } else if (diffDays < 0) {
        // Overdue quest
        safeCreateNotification({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Overdue Quest!',
          message: `"${quest.title}" is ${Math.abs(diffDays)} days overdue!`,
          priority: 2
        });
      }
    });
  });
}

// Daily motivation reminder
chrome.alarms.create('dailyMotivation', {
  periodInMinutes: 1440, // Once per day
  when: Date.now() + 60000 // Start in 1 minute
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'dailyMotivation') {
    sendDailyMotivation();
  }
});

function sendDailyMotivation() {
  const motivationalMessages = [
    "Ready to level up? Complete a quest today!",
    "Every quest completed is a step toward greatness!",
    "Your future self will thank you for the quests you complete today!",
    "Small daily improvements lead to epic results!",
    "What quest will you conquer today?",
    "Level up your life, one quest at a time!",
    "Today is a great day to be productive!"
  ];

  const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];

  chrome.storage.local.get(['gameState'], (result) => {
    if (!result.gameState) return;

    const incompleteQuests = [
      ...result.gameState.mainQuests.filter(q => !q.completed),
      ...result.gameState.sideQuests.filter(q => !q.completed)
    ].length;

    if (incompleteQuests > 0) {
      safeCreateNotification({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Life Quest',
        message: `${randomMessage} You have ${incompleteQuests} quest${incompleteQuests > 1 ? 's' : ''} waiting!`,
        priority: 1
      });
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'questCompleted') {
    safeCreateNotification({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Quest Completed!',
      message: `You earned ${request.xp} XP! Keep going!`,
      priority: 1
    });
  } else if (request.action === 'levelUp') {
    safeCreateNotification({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: `Level Up! Level ${request.level}`,
      message: 'Congratulations! You\'re getting stronger!',
      priority: 2
    });
  }
});
