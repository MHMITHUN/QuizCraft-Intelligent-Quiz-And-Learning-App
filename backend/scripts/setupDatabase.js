const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import all models
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizHistory = require('../models/QuizHistory');
const QuizEmbedding = require('../models/QuizEmbedding');
const QuizAttempt = require('../models/QuizAttempt');
const Category = require('../models/Category');
const Tag = require('../models/Tag');
const Class = require('../models/Class');
const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');
const Comment = require('../models/Comment');
const Subscription = require('../models/Subscription');

/**
 * Setup MongoDB Database with all collections and indexes
 */
async function setupDatabase() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // List of all collections to create
    const collections = [
      'users',
      'quizzes',
      'quizhistories',
      'quizembeddings',
      'quizattempts',
      'categories',
      'tags',
      'classes',
      'achievements',
      'userachievements',
      'activitylogs',
      'notifications',
      'comments',
      'subscriptions'
    ];

    console.log('\n📦 Creating collections...');
    
    // Create collections if they don't exist
    const existingCollections = await db.listCollections().toArray();
    const existingNames = existingCollections.map(c => c.name);

    for (const collectionName of collections) {
      if (!existingNames.includes(collectionName)) {
        await db.createCollection(collectionName);
        console.log(`✅ Created collection: ${collectionName}`);
      } else {
        console.log(`✓  Collection already exists: ${collectionName}`);
      }
    }

    console.log('\n🔍 Creating indexes...');

    // Users indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ 'subscription.plan': 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ points: -1 });
    console.log('✅ Users indexes created');

    // Quizzes indexes
    await Quiz.collection.createIndex({ creator: 1 });
    await Quiz.collection.createIndex({ category: 1 });
    await Quiz.collection.createIndex({ tags: 1 });
    await Quiz.collection.createIndex({ difficulty: 1 });
    await Quiz.collection.createIndex({ language: 1 });
    await Quiz.collection.createIndex({ isPublic: 1 });
    await Quiz.collection.createIndex({ status: 1 });
    await Quiz.collection.createIndex({ createdAt: -1 });
    await Quiz.collection.createIndex({ 'stats.views': -1 });
    await Quiz.collection.createIndex({ 'stats.averageScore': -1 });
    // Text index for search
    await Quiz.collection.createIndex({ 
      title: 'text', 
      description: 'text', 
      category: 'text' 
    });
    console.log('✅ Quizzes indexes created');

    // QuizHistory indexes
    await QuizHistory.collection.createIndex({ user: 1, createdAt: -1 });
    await QuizHistory.collection.createIndex({ quiz: 1 });
    await QuizHistory.collection.createIndex({ percentage: -1 });
    await QuizHistory.collection.createIndex({ passed: 1 });
    await QuizHistory.collection.createIndex({ createdAt: -1 });
    console.log('✅ QuizHistory indexes created');

    // QuizEmbeddings indexes
    await QuizEmbedding.collection.createIndex({ quiz: 1 }, { unique: true });
    await QuizEmbedding.collection.createIndex({ 'metadata.category': 1 });
    await QuizEmbedding.collection.createIndex({ 'metadata.tags': 1 });
    await QuizEmbedding.collection.createIndex({ lastUpdated: -1 });
    console.log('✅ QuizEmbedding indexes created');

    // QuizAttempts indexes
    await QuizAttempt.collection.createIndex({ user: 1, quiz: 1 });
    await QuizAttempt.collection.createIndex({ startedAt: -1 });
    await QuizAttempt.collection.createIndex({ status: 1 });
    console.log('✅ QuizAttempt indexes created');

    // Categories indexes
    await Category.collection.createIndex({ name: 1 }, { unique: true });
    await Category.collection.createIndex({ slug: 1 }, { unique: true });
    await Category.collection.createIndex({ isActive: 1 });
    console.log('✅ Category indexes created');

    // Tags indexes
    await Tag.collection.createIndex({ name: 1 }, { unique: true });
    await Tag.collection.createIndex({ usageCount: -1 });
    console.log('✅ Tag indexes created');

    // Classes indexes
    await Class.collection.createIndex({ teacher: 1 });
    await Class.collection.createIndex({ code: 1 }, { unique: true });
    await Class.collection.createIndex({ students: 1 });
    await Class.collection.createIndex({ isActive: 1 });
    console.log('✅ Class indexes created');

    // Achievements indexes
    await Achievement.collection.createIndex({ type: 1 });
    await Achievement.collection.createIndex({ isActive: 1 });
    console.log('✅ Achievement indexes created');

    // UserAchievements indexes
    await UserAchievement.collection.createIndex({ user: 1, achievement: 1 }, { unique: true });
    await UserAchievement.collection.createIndex({ earnedAt: -1 });
    console.log('✅ UserAchievement indexes created');

    // ActivityLogs indexes
    await ActivityLog.collection.createIndex({ user: 1, createdAt: -1 });
    await ActivityLog.collection.createIndex({ action: 1 });
    await ActivityLog.collection.createIndex({ createdAt: -1 });
    console.log('✅ ActivityLog indexes created');

    // Notifications indexes
    await Notification.collection.createIndex({ recipient: 1, read: 1 });
    await Notification.collection.createIndex({ createdAt: -1 });
    console.log('✅ Notification indexes created');

    // Comments indexes
    await Comment.collection.createIndex({ quiz: 1, createdAt: -1 });
    await Comment.collection.createIndex({ user: 1 });
    console.log('✅ Comment indexes created');

    // Subscriptions indexes
    await Subscription.collection.createIndex({ user: 1 });
    await Subscription.collection.createIndex({ status: 1 });
    await Subscription.collection.createIndex({ endDate: 1 });
    console.log('✅ Subscription indexes created');

    console.log('\n🎯 Setting up Vector Search for MongoDB Atlas...');
    console.log('⚠️  NOTE: Vector search index must be created manually in MongoDB Atlas UI');
    console.log('   Collection: quizembeddings');
    console.log('   Field: embedding (vector)');
    console.log('   Dimensions: 768 (for text-embedding-001)');
    console.log('   Similarity: cosine');
    console.log('   Index Name: embedding_index');
    
    console.log('\n📝 To create vector search index in MongoDB Atlas:');
    console.log('   1. Go to your cluster in MongoDB Atlas');
    console.log('   2. Click on "Search" tab');
    console.log('   3. Click "Create Search Index"');
    console.log('   4. Choose "Vector Search"');
    console.log('   5. Select database: quizcraft');
    console.log('   6. Select collection: quizembeddings');
    console.log('   7. Use this configuration:');
    console.log(`
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.category"
    },
    {
      "type": "filter",
      "path": "metadata.tags"
    }
  ]
}
    `);

    console.log('\n✅ Database setup completed successfully!');
    console.log('\n📊 Collections Summary:');
    const stats = await db.stats();
    console.log(`   Total Collections: ${stats.collections}`);
    console.log(`   Database Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n🎉 Your QuizCraft database is ready to use!');

  } catch (error) {
    console.error('❌ Database setup error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the setup
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('\n✨ Setup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = setupDatabase;
