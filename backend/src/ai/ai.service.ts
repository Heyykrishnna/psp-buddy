import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface GenerateAssessmentAiDto {
  topic: string;
  className?: string;
  questionCount?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
}

export interface ExplainQuestionAiDto {
  questionText: string;
  questionType?: string;
  studentAnswer?: string;
  correctAnswer?: string;
  topic?: string;
}

export interface GenerateStudyPlanAiDto {
  studentName?: string;
  weakTopics: Array<{ topic: string; masteryScore: number }>;
}

export interface TutorChatAiDto {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  topic?: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private groqClient: Groq | null = null;
  private model: string;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;
    this.model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

    if (apiKey && apiKey !== 'gsk_your_groq_api_key_here' && apiKey.trim().length > 0) {
      this.groqClient = new Groq({ apiKey: apiKey.trim() });
      this.logger.log(`Groq AI initialized with model ${this.model}`);
    } else {
      this.logger.warn('GROQ_API_KEY is missing or using placeholder in .env. AI service running in fallback mode.');
    }
  }

  private isGroqConfigured(): boolean {
    const apiKey = process.env.GROQ_API_KEY;
    return !!(this.groqClient && apiKey && apiKey !== 'gsk_your_groq_api_key_here');
  }

  // 1. Generate Assessment Questions via Groq AI
  async generateAssessment(dto: GenerateAssessmentAiDto) {
    const topic = dto.topic || 'Computer Science & Logic';
    const count = dto.questionCount || 5;
    const difficulty = dto.difficulty || 'MEDIUM';

    if (!this.isGroqConfigured()) {
      // Graceful fallback generator if API key is not yet set
      return {
        isFallback: true,
        message: 'GROQ_API_KEY is not configured in backend/.env. Returning structured sample questions.',
        topic,
        questions: Array.from({ length: count }, (_, i) => ({
          questionText: `[Sample Q${i + 1}] Explain key principles of ${topic} (${difficulty} difficulty).`,
          questionType: i % 2 === 0 ? 'SINGLE_CHOICE' : 'SHORT_ANSWER',
          difficulty,
          topic,
          points: 10,
          explanation: `This is a sample explanation for question ${i + 1} regarding ${topic}.`,
          shortAnswerKeywords: i % 2 !== 0 ? topic.toLowerCase().split(' ') : undefined,
          options:
            i % 2 === 0
              ? [
                  { optionText: `Primary concept of ${topic}`, isCorrect: true },
                  { optionText: 'Incorrect distractor option A', isCorrect: false },
                  { optionText: 'Incorrect distractor option B', isCorrect: false },
                  { optionText: 'Incorrect distractor option C', isCorrect: false },
                ]
              : [],
        })),
      };
    }

    try {
      const prompt = `You are an expert curriculum designer and educator.
Generate ${count} high-quality assessment questions on the topic "${topic}" for level/difficulty "${difficulty}".

Output MUST be valid strict JSON only, without any markdown wrappers or markdown code fences, matching this schema:
{
  "questions": [
    {
      "questionText": "string",
      "questionType": "SINGLE_CHOICE" | "TRUE_FALSE" | "SHORT_ANSWER",
      "difficulty": "${difficulty}",
      "topic": "${topic}",
      "points": number,
      "explanation": "string",
      "trueFalseAnswer": boolean (only if TRUE_FALSE),
      "shortAnswerKeywords": ["string"] (only if SHORT_ANSWER),
      "options": [
        { "optionText": "string", "isCorrect": boolean }
      ] (only if SINGLE_CHOICE - must have exactly 4 options with 1 correct)
    }
  ]
}`;

      const response = await this.groqClient!.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a JSON-only generating assistant for educational assessment generation. Respond with raw valid JSON only.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: 'json_object' },
      });

      const rawText = response.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(rawText);

      return {
        isFallback: false,
        model: this.model,
        topic,
        questions: parsed.questions || [],
      };
    } catch (err: any) {
      this.logger.error(`Groq AI Assessment Generation failed: ${err.message}`);
      throw new InternalServerErrorException(`Groq AI Generation failed: ${err.message}`);
    }
  }

  // 2. Explain Question & Provide Step-by-Step Guidance
  async explainQuestion(dto: ExplainQuestionAiDto) {
    if (!this.isGroqConfigured()) {
      return {
        isFallback: true,
        explanation: `Detailed explanation for "${dto.questionText}": The correct answer is directly based on fundamental concepts in ${dto.topic || 'the curriculum'}. Keep practicing core definitions and key problem solving patterns!`,
      };
    }

    try {
      const prompt = `You are a patient and expert AI tutor. Explain the following question clearly for a student:
Question: "${dto.questionText}"
Topic: "${dto.topic || 'General'}"
${dto.studentAnswer ? `Student's Answer: "${dto.studentAnswer}"` : ''}
${dto.correctAnswer ? `Correct Answer: "${dto.correctAnswer}"` : ''}

Provide a concise, motivating 3-part response:
1. Core Concept Explained
2. Why the correct answer is right (and why student's choice was common mistake, if provided)
3. 1 key memory tip or formula to remember next time.`;

      const response = await this.groqClient!.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 600,
      });

      return {
        isFallback: false,
        explanation: response.choices[0]?.message?.content || 'No explanation generated.',
      };
    } catch (err: any) {
      this.logger.error(`Groq AI Explain Question failed: ${err.message}`);
      return {
        isFallback: true,
        explanation: `Unable to query Groq AI currently (${err.message}). Default hint: Review key concepts in ${dto.topic || 'this topic'}.`,
      };
    }
  }

  // 3. Generate Personal Remediation Study Plan for Weak Topics
  async generateStudyPlan(dto: GenerateStudyPlanAiDto) {
    const weakTopicNames = dto.weakTopics.map((t) => `${t.topic} (${t.masteryScore}% mastery)`).join(', ');

    if (!this.isGroqConfigured()) {
      return {
        isFallback: true,
        studyPlan: {
          summary: `Personalized study recommendation for ${dto.studentName || 'Student'}. Focus area: ${weakTopicNames || 'Foundational Topics'}.`,
          steps: [
            'Review foundational concepts and definitions for weak topics.',
            'Solve 5 practice problems daily starting from Easy to Medium difficulty.',
            'Retake chapter assessments to track mastery improvement above 80%.',
          ],
        },
      };
    }

    try {
      const prompt = `You are an academic mentor. Create a custom 3-step study remediation plan for student ${dto.studentName || 'Student'} who is struggling with:
${weakTopicNames || 'general logic and algorithms'}.

Output raw valid JSON only:
{
  "summary": "string overview",
  "recommendedHoursPerWeek": number,
  "steps": [
    { "title": "string", "action": "string", "estimatedDays": number }
  ]
}`;

      const response = await this.groqClient!.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: 'You are a JSON generating academic advisor.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      return {
        isFallback: false,
        studyPlan: parsed,
      };
    } catch (err: any) {
      this.logger.error(`Groq AI Study Plan Generation failed: ${err.message}`);
      return {
        isFallback: true,
        studyPlan: {
          summary: `Focused revision on ${weakTopicNames}`,
          steps: [{ title: 'Daily Practice', action: 'Review weak topics in chapter notes.', estimatedDays: 3 }],
        },
      };
    }
  }

  // 4. Interactive Student AI Tutor Chat
  async chatTutor(dto: TutorChatAiDto) {
    if (!this.isGroqConfigured()) {
      return {
        isFallback: true,
        reply: `Hi! I am Lumora AI Tutor powered by Groq. Currently, GROQ_API_KEY is not set in backend/.env. Set GROQ_API_KEY to chat with me live!`,
      };
    }

    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        {
          role: 'system',
          content: `You are PSP Lumora AI Tutor, a helpful, friendly, and highly knowledgeable computer science and STEM tutor powered by Groq AI. Help students understand complex concepts, solve problems step-by-step, and prepare for assessments. Keep responses encouraging, clear, and easy to read with markdown formatting. Topic context: ${dto.topic || 'General STEM & Computer Science'}.`,
        },
      ];

      if (dto.conversationHistory) {
        dto.conversationHistory.forEach((msg) => {
          messages.push({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: msg.content,
          });
        });
      }

      messages.push({ role: 'user', content: dto.message });

      const response = await this.groqClient!.chat.completions.create({
        model: this.model,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      return {
        isFallback: false,
        reply: response.choices[0]?.message?.content || 'No response received from Groq AI.',
      };
    } catch (err: any) {
      this.logger.error(`Groq AI Tutor Chat failed: ${err.message}`);
      return {
        isFallback: true,
        reply: `Apologies, I encountered an issue connecting to Groq AI (${err.message}). Please try again shortly.`,
      };
    }
  }
}
