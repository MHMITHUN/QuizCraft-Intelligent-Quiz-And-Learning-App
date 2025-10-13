const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  freemium: {
    freeQuizLimit: { type: Number, default: 10 },
    premiumQuizLimit: { type: Number, default: 1000 }
  },
  ai: {
    quizModel: { type: String, default: 'gemini-1.5-pro' },
    embeddingModel: { type: String, default: 'gemini-embedding-001' }
  },
  vector: {
    collection: { type: String, default: 'quizembeddings' },
    index: { type: String, default: 'quizembeddings_vector_index' },
    similarity: { type: String, default: 'cosine' },
    dimensions: { type: Number, default: 768 }
  }
}, { collection: 'systemSettings', timestamps: true });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
