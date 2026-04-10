const mongoose = require('mongoose');
require('dotenv').config();
const Habit = require('./models/Habit');

const seedHabits = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB (Habits)');

    // We need to connect to the User database to dynamically retrieve the test user's ID
    const userDbUri = process.env.MONGODB_URI.replace('habit-tracker-habits', 'habit-tracker-users');
    const userConnection = mongoose.createConnection(userDbUri);
    
    // Access the 'users' collection from the User database
    const user = await userConnection.collection('users').findOne({ email: 'test@example.com' });
    
    await userConnection.close();

    if (!user) {
      console.log('⚠️ Test user not found. Please run the user-service seed first.');
      process.exit(1);
    }

    const userId = user._id.toString();

    // Clear existing habits for this test user to prevent duplicates
    await Habit.deleteMany({ userId });
    console.log('🧹 Cleared existing habits for test user');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const habits = [
      {
        userId,
        name: 'Morning Workout',
        description: '30 minutes of cardio or weightlifting',
        category: 'fitness',
        frequency: 'daily',
        completions: [
          { date: twoDaysAgo, completed: true },
          { date: yesterday, completed: true }
        ]
      },
      {
        userId,
        name: 'Read 20 Pages',
        description: 'Read a non-fiction book',
        category: 'learning',
        frequency: 'daily',
        completions: [
          { date: twoDaysAgo, completed: true }
        ]
      },
      {
        userId,
        name: 'Meditation',
        description: '10 minutes of mindfulness',
        category: 'mindfulness',
        frequency: 'daily',
        completions: [
          { date: yesterday, completed: true }
        ]
      },
      {
        userId,
        name: 'Drink Water',
        description: 'Drink 8 glasses of water',
        category: 'health',
        frequency: 'daily',
        completions: []
      },
      {
        userId,
        name: 'Deep Work Session',
        description: '2 hours of uninterrupted work',
        category: 'productivity',
        frequency: 'daily',
        completions: [
          { date: twoDaysAgo, completed: true },
          { date: yesterday, completed: true }
        ]
      }
    ];

    for (let habitData of habits) {
      const habit = new Habit(habitData);
      habit.calculateStreak(); // updates current & longest streak
      await habit.save();
    }

    console.log('✅ 5 sample habits created successfully for test user!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding habits:', error);
    process.exit(1);
  }
};

seedHabits();
