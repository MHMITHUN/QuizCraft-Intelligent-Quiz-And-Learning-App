const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const Quiz = require('../models/Quiz');
const embeddingService = require('../services/embeddingService');

/**
 * @route   GET /api/search/similar
 * @desc    Search for similar quizzes using vector search
 * @access  Public/Private
 */
router.get('/similar', optionalAuth, async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 3 characters'
      });
    }

    // Use vector search to find similar quizzes
    const similarResults = await embeddingService.findSimilarQuizzes(query, parseInt(limit));

    if (similarResults.length === 0) {
      // Fallback to text-based search
      const fallbackQuizzes = await Quiz.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } },
          { category: { $regex: query, $options: 'i' } }
        ],
        status: 'published',
        isPublic: true
      })
        .populate('creator', 'name')
        .select('-questions.correctAnswer -questions.explanation')
        .limit(parseInt(limit));

      return res.json({
        success: true,
        searchMethod: 'fallback',
        data: {
          quizzes: fallbackQuizzes,
          total: fallbackQuizzes.length
        }
      });
    }

    // Get full quiz details for vector search results
    const quizIds = similarResults.map(r => r.quizId);
    const quizzes = await Quiz.find({ _id: { $in: quizIds }, status: 'published' })
      .populate('creator', 'name')
      .select('-questions.correctAnswer -questions.explanation');

    // Merge with similarity scores
const enrichedResults = quizzes.map(quiz => {
      const result = similarResults.find(r => String(r.quizId) === quiz._id.toString());
      return {
        ...quiz.toObject(),
        similarity: result?.similarity || 0
      };
    }).sort((a, b) => b.similarity - a.similarity);

    res.json({
      success: true,
      searchMethod: 'vector',
      data: {
        quizzes: enrichedResults,
        total: enrichedResults.length
      }
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed'
    });
  }
});

/**
 * @route   GET /api/search/quiz/:id/similar
 * @desc    Find quizzes similar to a specific quiz
 * @access  Public/Private
 */
router.get('/quiz/:id/similar', optionalAuth, async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    // Create search query from quiz content
    const searchQuery = `${quiz.title} ${quiz.description} ${quiz.tags.join(' ')}`;
    
    const similarResults = await embeddingService.findSimilarQuizzes(searchQuery, 11);
    
    // Filter out the original quiz
    const filteredResults = similarResults.filter(r => r.quizId !== req.params.id).slice(0, 10);

    const quizIds = filteredResults.map(r => r.quizId);
    const quizzes = await Quiz.find({ _id: { $in: quizIds }, status: 'published' })
      .populate('creator', 'name')
      .select('-questions.correctAnswer -questions.explanation');

    res.json({
      success: true,
      data: {
        quizzes,
        total: quizzes.length
      }
    });
  } catch (error) {
    console.error('Similar quiz search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find similar quizzes'
    });
  }
});

/**
 * @route   GET /api/search/categories
 * @desc    Get all quiz categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await Quiz.distinct('category', { status: 'published', isPublic: true });
    
    res.json({
      success: true,
      data: { categories: categories.filter(c => c) }
    });
  } catch (error) {
    console.error('Categories fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
});

/**
 * @route   GET /api/search/tags
 * @desc    Get popular tags
 * @access  Public
 */
router.get('/tags', async (req, res) => {
  try {
    const quizzes = await Quiz.find({ status: 'published', isPublic: true }).select('tags');
    
    // Flatten and count tags
    const tagCounts = {};
    quizzes.forEach(quiz => {
      quiz.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by count and get top tags
    const popularTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }));

    res.json({
      success: true,
      data: { tags: popularTags }
    });
  } catch (error) {
    console.error('Tags fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tags'
    });
  }
});

module.exports = router;
