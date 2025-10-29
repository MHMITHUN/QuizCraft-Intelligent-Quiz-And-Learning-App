# Automatic Language Detection for Quiz Generation

## Overview
The quiz generation system now automatically detects the language of uploaded content and generates questions in the same language. This ensures that:
- **Bangla/Bengali content** → Questions generated in **Bengali** (বাংলা)
- **English content** → Questions generated in **English**

## How It Works

### 1. Language Detection Algorithm
The system analyzes the extracted text content using Unicode character ranges:
- **Bengali Unicode Range**: `\u0980-\u09FF`
- **Detection Threshold**: If Bengali characters make up more than 30% of the content, it's classified as Bengali
- **Default**: English for all other cases

### 2. Implementation Details

#### Text Extractor Service (`backend/services/textExtractor.js`)
Added `detectLanguage()` method that:
- Counts Bengali characters in the text
- Calculates the percentage of Bengali vs. total characters
- Returns 'bn' for Bengali or 'en' for English
- Logs detection results with percentages for debugging

#### Quiz Routes (`backend/routes/quiz.js`)
Updated all quiz generation endpoints:
- `/api/quiz/upload-and-generate` - File upload quiz generation
- `/api/quiz/stream-upload-and-generate` - Streaming file upload
- `/api/quiz/generate-from-text` - Direct text input
- `/api/quiz/stream-from-text` - Streaming text input

Each endpoint now:
1. Extracts/receives the text content
2. Auto-detects language using `textExtractor.detectLanguage()`
3. Uses detected language for quiz generation
4. Saves the detected language to the database

#### Gemini AI Service (`backend/services/geminiService.js`)
Enhanced prompts to be more explicit about language requirements:
- **Bengali**: All questions, options, explanations, title, and description MUST be in Bengali script (বাংলা)
- **English**: All content MUST be in English
- Added explicit instruction: "The quiz language MUST match the language of the provided content"

## Examples

### Example 1: Bengali Content
**Input Text:**
```
বাংলাদেশ দক্ষিণ এশিয়ার একটি সার্বভৌম রাষ্ট্র। এর রাজধানী ঢাকা।
```

**Detection Result:**
- Language detected: Bengali (100% Bengali characters)

**Generated Questions:** All in Bengali (বাংলা)

### Example 2: English Content
**Input Text:**
```
Bangladesh is a country in South Asia. Its capital is Dhaka.
```

**Detection Result:**
- Language detected: English (0% Bengali characters)

**Generated Questions:** All in English

### Example 3: Mixed Content (Majority Bengali)
**Input Text:**
```
বাংলাদেশ দক্ষিণ এশিয়ার একটি সার্বভৌম রাষ্ট্র। Bangladesh is in South Asia.
```

**Detection Result:**
- Language detected: Bengali (56.3% Bengali characters)

**Generated Questions:** All in Bengali (বাংলা)

### Example 4: Mixed Content (Majority English)
**Input Text:**
```
Bangladesh is a country in South Asia with a rich history. বাংলা ভাষা।
```

**Detection Result:**
- Language detected: English (10.2% Bengali characters)

**Generated Questions:** All in English

## Testing

Run the language detection test suite:
```bash
cd backend
node test-language-detection.js
```

Expected output:
```
🧪 Testing Language Detection
============================================================
📊 Results: 5 passed, 0 failed out of 5 tests
🎉 All tests passed!
```

## API Changes

### Request Parameters
The `language` parameter is now **optional** in all quiz generation endpoints:
- If provided: Uses the specified language
- If omitted: Automatically detects from content

### Response
For streaming endpoints, a new event is emitted:
```json
{
  "event": "language-detected",
  "language": "bn"
}
```

## Console Logging

The system logs language detection for debugging:
```
📝 Language detected: Bengali (39/39 chars = 100.0%)
🌐 Using language: bn
🤖 Generating quiz with AI...
```

## Benefits

1. **User Experience**: No need for users to manually select language
2. **Accuracy**: Questions match the language of the source material
3. **Automatic**: Works seamlessly for both file uploads and text input
4. **Flexible**: Users can still override by explicitly providing language parameter
5. **Robust**: Handles mixed-language content intelligently

## Future Enhancements

Potential improvements:
- Support for more languages (Hindi, Urdu, etc.)
- More sophisticated NLP-based language detection
- Language-specific question generation strategies
- Multi-language quiz support (questions in multiple languages)
