// backend/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
        this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    }

    // Detect language from content
    detectLanguage(content) {
        // Common Filipino/Tagalog indicators
        const filipinoIndicators = [
            'ang', 'ng', 'mga', 'sa', 'ay', 'ito', 'iyan', 'doon', 
            'dito', 'kayo', 'tayo', 'sila', 'kami', 'kumusta', 'paalam',
            'maganda', 'masama', 'maliit', 'malaki', 'bago', 'luma',
            'pag', 'kapag', 'kung', 'dahil', 'kasi', 'para', 'upang',
            'maging', 'gawin', 'sabihin', 'makita', 'magkaroon',
            'pilipino', 'tagalog', 'filipino', 'pinoy'
        ];
        
        // Common English indicators (to differentiate)
        const englishIndicators = [
            'the', 'and', 'for', 'with', 'this', 'that', 'these', 
            'those', 'from', 'have', 'will', 'would', 'could', 'should',
            'english', 'language', 'university', 'college', 'student',
            'teacher', 'professor', 'assignment', 'homework', 'exam'
        ];
        
        const contentLower = content.toLowerCase();
        let filipinoScore = 0;
        let englishScore = 0;
        
        // Count Filipino words
        for (const word of filipinoIndicators) {
            if (contentLower.includes(word.toLowerCase())) {
                filipinoScore++;
            }
        }
        
        // Count English words
        for (const word of englishIndicators) {
            if (contentLower.includes(word.toLowerCase())) {
                englishScore++;
            }
        }
        
        // Detect based on scores
        if (filipinoScore > englishScore && filipinoScore > 3) {
            return 'filipino';
        }
        
        return 'english'; // Default to English
    }

    // Get language instruction for prompts
    getLanguageInstruction(language) {
        const instructions = {
            'filipino': `MAHALAGANG INSTRUKSYON: Ang dokumento ay nasa wikang Filipino/Tagalog.
            DAPAT kang sumagot sa wikang Filipino.
            Gumamit ng wastong balarila at bokabularyo sa Filipino.
            Huwag gumamit ng Ingles maliban kung kinakailangan (tulad ng mga technical terms).
            Isalin ang lahat ng mga termino at paliwanag sa Filipino.
            Ang mga tanong at sagot ay dapat nasa Filipino.`,
            
            'english': `IMPORTANT INSTRUCTION: The document content is in English.
            You MUST respond in English only.
            Use proper English grammar and vocabulary.
            All questions, answers, and explanations must be in English.
            Do not use other languages unless quoting specific terms.`
        };
        
        return instructions[language] || instructions.english;
    }

    // In generateSummaryFromContent method, update the prompt:

async generateSummaryFromContent(content, title = '', fileInfo = {}) {
    try {
        if (!content || content.length < 50) {
            throw new Error('Document content is too short or could not be extracted');
        }
        
        const detectedLanguage = this.detectLanguage(content);
        console.log(`📝 Detected language: ${detectedLanguage.toUpperCase()}`);
        
        const truncatedContent = content.length > 30000 ? content.substring(0, 30000) : content;
        const languageInstruction = this.getLanguageInstruction(detectedLanguage);
        
        let prompt = '';
        
        if (detectedLanguage === 'filipino') {
            prompt = `Ikaw ay isang AI assistant na tumutulong sa mga estudyante na maunawaan ang kanilang mga leksyon.

${languageInstruction}

NILALAMAN NG DOKUMENTO (${title}):
${truncatedContent}

IMPORTANTENG PANUTO: Dapat mong ibalik LAMANG ang formatted content sa ibaba. HUWAG magdagdag ng anumang paliwanag, introduksyon, o konklusyon bago o pagkatapos ng iyong sagot. HUWAG gumamit ng mga pariralang tulad ng "Narito ang..." o "Batay sa dokumento...". Direktang ibigay ang buod.

IBALIK LAMANG ANG SUMUSUNOD NA FORMAT:

**PANGUNAHING KONSEPTO**
[Ilagay dito ang 3-5 pangunahing konsepto mula sa dokumento na may maikling paliwanag]

**MAHALAGANG DAPAT TANDAAN**
[Ilagay dito ang mahahalagang impormasyon na direktang matatagpuan sa dokumento]

**BUOD**
[Ilagay dito ang 3-5 pangungusap na buod ng aktwal na nilalaman ng dokumento]

**MGA TANONG PARA SA SARILING PAGSUSURI**
[Ilagay dito ang 3 katanungan na sumusubok sa pag-unawa sa dokumento]`;
        } else {
            prompt = `You are an AI assistant helping students understand their course materials.

${languageInstruction}

DOCUMENT CONTENT (${title}):
${truncatedContent}

CRITICAL INSTRUCTION: You MUST return ONLY the formatted content below. DO NOT add any explanations, introductions, or conclusions before or after your response. DO NOT use phrases like "Here is..." or "Based on the document...". Return the summary directly.

RETURN ONLY THE FOLLOWING FORMAT:

**MAIN CONCEPTS**
[List 3-5 key concepts from the document with brief explanations]

**KEY TAKEAWAYS**
[List important information explicitly stated in the document]

**SUMMARY**
[Write a 3-5 sentence concise summary of the actual content]

**SELF-ASSESSMENT QUESTIONS**
[List 3 questions that test understanding of the document]`;
        }

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let summaryText = response.text().trim();
        
        // Clean up any remaining preamble if it slipped through
        const filipinoPreamblePatterns = [
            /^Narito ang[^:]*:\s*/i,
            /^Batay sa[^:]*:\s*/i,
            /^Eto ang[^:]*:\s*/i,
            /^Ito ang[^:]*:\s*/i,
            /^Ayon sa[^:]*:\s*/i
        ];
        
        const englishPreamblePatterns = [
            /^Here (?:is|are) the[^:]*:\s*/i,
            /^Based on the[^:]*:\s*/i,
            /^The following (?:is|are)[^:]*:\s*/i,
            /^I will now[^:]*:\s*/i
        ];
        
        // Remove preamble if present
        for (const pattern of [...filipinoPreamblePatterns, ...englishPreamblePatterns]) {
            summaryText = summaryText.replace(pattern, '');
        }
        
        return {
            summary: summaryText,
            generatedAt: new Date().toISOString(),
            model: this.modelName,
            source: 'document-content',
            documentTitle: title,
            contentLength: content.length,
            detectedLanguage: detectedLanguage
        };
    } catch (error) {
        console.error('Gemini summary error:', error);
        throw new Error(`Failed to generate summary: ${error.message}`);
    }
}

// Update generateReviewerFromContent method:

async generateReviewerFromContent(content, title = '', options = {}) {
    try {
        const { numQuestions = 10, difficulty = 'medium' } = options;
        
        if (!content || content.length < 50) {
            throw new Error('Document content is too short or could not be extracted');
        }
        
        const detectedLanguage = this.detectLanguage(content);
        console.log(`📝 Detected language: ${detectedLanguage.toUpperCase()}`);
        
        const truncatedContent = content.length > 30000 ? content.substring(0, 30000) : content;
        const languageInstruction = this.getLanguageInstruction(detectedLanguage);
        
        let prompt = '';
        
        if (detectedLanguage === 'filipino') {
            prompt = `Lumilikha ka ng mga katanungan sa pagsusuri batay sa partikular na dokumentong ito.

${languageInstruction}

NILALAMAN NG DOKUMENTO (${title}):
${truncatedContent}

MAHALAGANG PANUTO:
1. Gumawa ng ${numQuestions} katanungan na BATAY LAMANG sa nilalaman ng dokumentong ito
2. Dapat subukin ng mga tanong ang pag-unawa sa aktwal na nasa dokumento
3. HUWAG gumawa ng mga tanong tungkol sa mga paksang hindi sakop
4. Antas ng kahirapan: ${difficulty}
5. **CRITICAL: Magbalik LAMANG ng valid JSON. HUWAG magdagdag ng anumang text bago o pagkatapos ng JSON. HUWAG gumamit ng mga pariralang tulad ng "Narito ang..."**

IBALIK ANG EXACT NA JSON STRUCTURE NA ITO (walang ibang text):

{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Tanong dito",
      "options": ["Opsyon 1", "Opsyon 2", "Opsyon 3", "Opsyon 4"],
      "correctAnswer": "Opsyon 1",
      "explanation": "Paliwanag kung bakit ito ang tamang sagot"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Pahayag na huhusgahan",
      "correctAnswer": "Totoo",
      "explanation": "Paliwanag ayon sa dokumento"
    },
    {
      "id": 3,
      "type": "short_answer",
      "question": "Tanong na nangangailangan ng maikling sagot",
      "correctAnswer": "Inaasahang sagot",
      "explanation": "Paliwanag ng tamang sagot"
    }
  ],
  "summary": "Maikling buod ng nilalaman ng dokumento sa Filipino",
  "studyTips": ["Tip sa pag-aaral 1", "Tip sa pag-aaral 2", "Tip sa pag-aaral 3"]
}

TANDAAN: Ang "options" array ay PARA LAMANG sa multiple_choice questions.`;
        } else {
            prompt = `You are creating practice questions based on this specific document.

${languageInstruction}

DOCUMENT CONTENT (${title}):
${truncatedContent}

CRITICAL INSTRUCTIONS:
1. Create ${numQuestions} questions based ONLY on this document's content
2. Questions must test understanding of what is ACTUALLY in the document
3. DO NOT create questions about topics not covered
4. Difficulty level: ${difficulty}
5. **CRITICAL: Return ONLY valid JSON. DO NOT add any text before or after the JSON. DO NOT use phrases like "Here is the JSON" or "Based on the document".**

Return EXACTLY this JSON structure (no other text):

{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text here",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "explanation": "Explanation here"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "Statement to judge",
      "correctAnswer": "True",
      "explanation": "Explanation here"
    },
    {
      "id": 3,
      "type": "short_answer",
      "question": "Question text here",
      "correctAnswer": "Expected answer",
      "explanation": "Explanation here"
    }
  ],
  "summary": "Brief overview of document content",
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"]
}

REMEMBER: Only include "options" array for multiple_choice questions.`;
        }

        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();
        
        // Remove any preamble that might have slipped through
        const removePreamble = (str) => {
            // Remove common Filipino/English preambles
            const patterns = [
                /^Narito ang[^:]*:\s*/i,
                /^Batay sa[^:]*:\s*/i,
                /^Eto ang[^:]*:\s*/i,
                /^Ito ang[^:]*:\s*/i,
                /^Ayon sa[^:]*:\s*/i,
                /^Here (?:is|are) the[^:]*:\s*/i,
                /^Based on the[^:]*:\s*/i,
                /^I will now[^:]*:\s*/i,
                /^The following[^:]*:\s*/i,
                /^```json\s*/i,
                /^```\s*/i
            ];
            
            for (const pattern of patterns) {
                str = str.replace(pattern, '');
            }
            return str.trim();
        };
        
        text = removePreamble(text);
        
        // Find JSON object
        let jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            text = jsonMatch[0];
        }
        
        // Parse JSON
        let reviewer;
        try {
            reviewer = JSON.parse(text);
        } catch (parseError) {
            console.error('Initial JSON parse failed, attempting to fix...');
            // Attempt to fix common JSON issues
            text = text.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":');
            text = text.replace(/:\s*'([^']*)'/g, ':"$1"');
            text = text.replace(/,\s*}/g, '}');
            text = text.replace(/,\s*\]/g, ']');
            reviewer = JSON.parse(text);
        }
        
        // Validate and ensure proper structure
        if (!reviewer.questions || !Array.isArray(reviewer.questions)) {
            throw new Error('Invalid questions format');
        }
        
        // Ensure each question has required fields based on type
        reviewer.questions = reviewer.questions.map(q => {
            if (typeof q.id !== 'number') {
                q.id = parseInt(q.id) || Math.random();
            }
            
            if (q.type === 'true_false') {
                q.correctAnswer = String(q.correctAnswer);
                delete q.options;
            }
            
            if (q.type === 'short_answer') {
                delete q.options;
            }
            
            if (q.type === 'multiple_choice' && !Array.isArray(q.options)) {
                q.options = [];
            }
            
            // Ensure explanation exists
            if (!q.explanation) {
                q.explanation = detectedLanguage === 'filipino' ? 
                    'Batay sa nilalaman ng dokumento.' : 
                    'Based on the document content.';
            }
            
            return q;
        });
        
        // Limit to requested number
        if (reviewer.questions.length > numQuestions) {
            reviewer.questions = reviewer.questions.slice(0, numQuestions);
        }
        
        return {
            questions: reviewer.questions,
            summary: reviewer.summary || (detectedLanguage === 'filipino' ? 
                `Mga katanungan para sa ${title}` : 
                `Review questions for ${title}`),
            studyTips: reviewer.studyTips || (detectedLanguage === 'filipino' ? 
                ['Basahin nang mabuti ang materyal', 'Mag-note taking habang nag-aaral', 'Mag-practice nang regular'] :
                ['Review the material carefully', 'Take notes while studying', 'Practice regularly']),
            generatedAt: new Date().toISOString(),
            model: this.modelName,
            settings: { numQuestions, difficulty },
            contentLength: content.length,
            detectedLanguage: detectedLanguage
        };
    } catch (error) {
        console.error('Reviewer generation error:', error);
        throw error;
    }
}

    // Fallback reviewer for when content can't be accessed
    getFallbackReviewer(title, errorMessage = '', detectedLanguage = 'english') {
        if (detectedLanguage === 'filipino') {
            return {
                questions: [{
                    id: 1,
                    type: 'multiple_choice',
                    question: 'Hindi ma-access ang nilalaman ng dokumento',
                    options: [
                        'I-set ang Google Drive file sharing sa "Anyone with the link can view"',
                        'Siguraduhing hindi restricted ang file ng iyong organisasyon',
                        'Tiyaking ang file ay naglalaman ng nababasang text (hindi scanned images)',
                        'Lahat ng nabanggit'
                    ],
                    correctAnswer: 'Lahat ng nabanggit',
                    explanation: `Kailangang maging publicly accessible ang Google Drive file para mabasa ng AI. Error: ${errorMessage}`
                }],
                summary: `Hindi ma-access ang "${title}". Pakisiguraduhin na:
1. Ang Google Drive file ay naka-share publicly (Anyone with the link can view)
2. Ang file ay naglalaman ng nababasang text (hindi scanned images)
3. Tama ang URL at hindi na-delete ang file`,
                studyTips: [
                    'Pumunta sa Google Drive at i-right click ang file',
                    'Piliin ang "Share" mula sa menu',
                    'I-click ang "General access" at palitan sa "Anyone with the link"',
                    'I-set ang permission sa "Viewer" (hindi Editor)',
                    'I-click ang "Done" at subukang muli'
                ],
                generatedAt: new Date().toISOString(),
                isFallback: true,
                errorDetails: errorMessage,
                detectedLanguage: 'filipino'
            };
        }
        
        return {
            questions: [{
                id: 1,
                type: 'multiple_choice',
                question: 'Unable to access the document content',
                options: [
                    'Set Google Drive file sharing to "Anyone with the link can view"',
                    'Make sure the file is not restricted by your organization',
                    'Check that the file contains readable text (not just images)',
                    'All of the above'
                ],
                correctAnswer: 'All of the above',
                explanation: `The Google Drive file needs to be publicly accessible for AI to read it. Error: ${errorMessage}`
            }],
            summary: `Cannot access "${title}". Please ensure:
1. The Google Drive file is shared publicly (Anyone with the link can view)
2. The file contains extractable text (not scanned images)
3. The URL is correct and the file hasn't been deleted`,
            studyTips: [
                'Go to Google Drive and right-click the file',
                'Select "Share" from the menu',
                'Click "General access" and change to "Anyone with the link"',
                'Set permission to "Viewer" (not Editor)',
                'Click "Done" and try generating again'
            ],
            generatedAt: new Date().toISOString(),
            isFallback: true,
            errorDetails: errorMessage,
            detectedLanguage: 'english'
        };
    }
}

module.exports = new GeminiService();