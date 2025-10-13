const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiService {
  constructor() {
    this.model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL,
    });
this.embeddingModel = genAI.getGenerativeModel({
      model: 'text-embedding-004',
    });
  }

  /**
   * Generate embedding from text
   * @param {string} text - Text to embed
   * @returns {Promise<number[]>} - The embedding vector
   */
  async generateEmbedding(text) {
    try {
const result = await this.embeddingModel.embedContent({
        content: { parts: [{ text }] }
      });
      const embedding = result.embedding;
      return embedding.values;
    } catch (error) {
      console.error('Gemini embedding error:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  /**
   * Generate quiz from text content
   * @param {Object} options - Quiz generation options
   * @returns {Promise<Object>} Generated quiz data
   */
  async generateQuiz(options) {
    const {
      content,
      numQuestions = 10,
      quizType = 'mcq',
      difficulty = 'medium',
      language = 'en',
      category = '',
    } = options;

    try {
      const prompt = this.buildPrompt(
        content,
        numQuestions,
        quizType,
        difficulty,
        language,
        category
      );

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse the AI response
      return this.parseQuizResponse(text, quizType);
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate quiz from AI: ' + error.message);
    }
  }

  /**
   * Build prompt for Gemini AI
   */
  buildPrompt(content, numQuestions, quizType, difficulty, language, category) {
    const languageInstruction =
      language === 'bn'
        ? 'Generate the quiz in Bengali language (বাংলা ভাষায়).'
        : 'Generate the quiz in English language.';

    let typeInstruction = '';
    if (quizType === 'mcq') {
      typeInstruction =
        'Each question should have 4 multiple choice options with only one correct answer.';
    } else if (quizType === 'true-false') {
      typeInstruction = 'Each question should be a True/False question.';
    } else if (quizType === 'short-answer') {
      typeInstruction = 'Each question should require a short text answer.';
    }

    const categoryInstruction = category
      ? `Focus on the category: ${category}.`
      : '';

    return `
You are an expert educational quiz generator. Create a high-quality quiz based on the following content.

CONTENT:
${content}

REQUIREMENTS:
- Generate exactly ${numQuestions} questions
- Question type: ${quizType}
- Difficulty level: ${difficulty}
- ${languageInstruction}
- ${typeInstruction}
- ${categoryInstruction}
- Include detailed explanations for each correct answer
- Ensure questions test understanding, not just memorization
- Questions should be clear, unambiguous, and pedagogically sound

FORMAT YOUR RESPONSE AS VALID JSON:
{
  "title": "Quiz title based on content",
  "description": "Brief description of quiz topic",
  "category": "Main category/subject",
  "questions": [
    {
      "questionText": "The question text",
      "type": "${quizType}",
      "options": [
        {"text": "Option A", "isCorrect": false},
        {"text": "Option B", "isCorrect": true},
        {"text": "Option C", "isCorrect": false},
        {"text": "Option D", "isCorrect": false}
      ],
      "correctAnswer": "The correct answer text",
      "explanation": "Detailed explanation of why this is correct",
      "difficulty": "easy|medium|hard",
      "points": 1
    }
  ]
}

IMPORTANT:
- Return ONLY valid JSON, no additional text
- For true-false questions, use only two options: "True" and "False"
- For short-answer questions, provide the expected answer in "correctAnswer" field
- Ensure all JSON is properly formatted and escaped
`;
  }

  /**
   * Parse AI response into structured quiz data
   */
  parseQuizResponse(text, quizType) {
    try {
      // Remove markdown code blocks if present
      let cleanedText = text.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/```\n?/g, '');
      }

      const quizData = JSON.parse(cleanedText);

      // Validate and normalize the data
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz structure: missing questions array');
      }

      // Ensure all questions have required fields
      quizData.questions = quizData.questions.map((q, index) => ({
        questionText: q.questionText || `Question ${index + 1}`,
        type: q.type || quizType,
        options: q.options || [],
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || 'No explanation provided',
        difficulty: q.difficulty || 'medium',
        points: q.points || 1,
      }));

      return {
        success: true,
        data: quizData,
      };
    } catch (error) {
      console.error('Parse Error:', error);
      console.error('Raw text:', text);

      // Return a fallback structure
      return {
        success: false,
        error: 'Failed to parse AI response',
        rawResponse: text,
      };
    }
  }

  /**
   * Generate text summary for analytics
   */
  async generateSummary(content, maxLength = 200) {
    try {
      const prompt = `Summarize the following content in ${maxLength} characters or less:\n\n${content}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Summary generation error:', error);
      return content.substring(0, maxLength) + '...';
    }
  }

  /**
   * Extract key topics from content
   */
  async extractTopics(content) {
    try {
      const prompt = `Extract 3-5 key topics or keywords from this content. Return as a JSON array of strings:\n\n${content}`;
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch {
        // Fallback: extract from text
        return text
          .split(/[,\n]/)
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
          .slice(0, 5);
      }
    } catch (error) {
      console.error('Topic extraction error:', error);
      return [];
    }
  }
}

module.exports = new GeminiService();
