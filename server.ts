import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json({ limit: '25mb' }));

// Initialize Google GenAI client securely on the server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint for direct audio recording transcription using Gemini
app.post('/api/transcribe-audio', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', lang = 'en-IN' } = req.body;

    if (!audioBase64 || typeof audioBase64 !== 'string') {
      return res.status(400).json({ error: 'Valid audioBase64 string is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server.',
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          inlineData: {
            mimeType: mimeType.split(';')[0], // normalize audio/webm
            data: audioBase64,
          },
        },
        {
          text: `Transcribe this doctor-patient medical consultation verbatim. Accurately capture Indian clinical terminology, dosages, and complaints. The spoken language may be Indian English or Hindi. Return solely the verbatim transcript without commentary.`,
        },
      ],
    });

    const transcript = response.text?.trim() || '';
    return res.json({ success: true, transcript });
  } catch (error: any) {
    console.error('Error in /api/transcribe-audio:', error);
    return res.status(500).json({
      error: error.message || 'Failed to transcribe audio with Gemini',
    });
  }
});

// API endpoint for AI-assisted clinical note structuring and summarization
app.post('/api/gemini/parse-clinical', async (req: Request, res: Response) => {
  try {
    const { transcript, clinicType, patientDemographics, triageData } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Valid transcript string is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'GEMINI_API_KEY is not configured on the server. Falling back to on-device rules engine.',
      });
    }

    const systemInstruction = `You are ClinicScribe AI, an expert Indian Primary Health Centre (PHC) clinical documentation assistant.
Analyze the consultation transcript between the doctor and patient, together with the preliminary triage information pre-filled by the receptionist.
Receptionist Preliminary Triage Data: ${triageData ? JSON.stringify(triageData) : 'None'}.
Clinic type context: ${clinicType || 'General OPD'}.
Patient demographics: ${patientDemographics ? JSON.stringify(patientDemographics) : 'Unknown'}.

Extract and combine the receptionist's initial vitals/complaints with the doctor's final conversation:
- Chief Complaint & duration
- History of present illness and pertinent negatives
- Examination findings & final vitals (merge receptionist BP/temp/sugar with any new readings)
- Impression / Clinical diagnosis (with standard ICD/PHC code)
- Standard Indian generic medications (dosage, frequency [OD/BD/TDS/SOS], duration, instructions)
- Diet, hydration, lifestyle, and emergency red-flag warning signs
- A crisp 1-2 sentence patient summary for the printed OPD report.
Keep responses strictly grounded in the medical findings.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Doctor spoken consultation transcript:
"""
${transcript}
"""`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chiefComplaint: { type: Type.STRING, description: 'Main presenting complaint' },
            duration: { type: Type.STRING, description: 'Duration of symptoms (e.g. 3 days, 1 week)' },
            history: { type: Type.STRING, description: 'History of present illness and pertinent negatives' },
            vitals: {
              type: Type.OBJECT,
              properties: {
                bp: { type: Type.STRING, description: 'Blood pressure, e.g. 130/80 mmHg' },
                pulse: { type: Type.STRING, description: 'Pulse / Heart Rate, e.g. 78 bpm' },
                temp: { type: Type.STRING, description: 'Temperature, e.g. 101 F or 38.3 C' },
                weight: { type: Type.STRING, description: 'Weight in kg' },
                spo2: { type: Type.STRING, description: 'Oxygen saturation, e.g. 98%' },
              },
            },
            examination: { type: Type.STRING, description: 'Systemic physical examination findings' },
            impression: { type: Type.STRING, description: 'Working diagnosis or clinical impression' },
            diagnosisCode: { type: Type.STRING, description: 'Short ICD/PHC code, e.g. URTI, HTN, T2DM, MALARIA, GE, ANC' },
            medications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  drug: { type: Type.STRING, description: 'Drug name and strength (e.g. Tab Paracetamol 500mg)' },
                  dosage: { type: Type.STRING, description: 'Dose quantity' },
                  frequency: { type: Type.STRING, description: 'Frequency (e.g. TDS, BD, OD, SOS)' },
                  duration: { type: Type.STRING, description: 'Duration (e.g. 3 days, 1 month)' },
                  instructions: { type: Type.STRING, description: 'Instructions (e.g. After food)' },
                },
              },
            },
            advice: { type: Type.STRING, description: 'Diet, hydration, and danger signs warning' },
            followUpDays: { type: Type.INTEGER, description: 'Follow-up timeline in days (e.g. 3, 7, 30)' },
            freeTextSummary: { type: Type.STRING, description: 'Concise 1-2 sentence single-page summary for the patient' },
          },
          required: ['chiefComplaint', 'impression', 'freeTextSummary'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    return res.json({ success: true, data: parsedJson });
  } catch (error: any) {
    console.error('Error in /api/gemini/parse-clinical:', error);
    return res.status(500).json({
      error: error.message || 'Failed to parse clinical transcript with Gemini',
    });
  }
});

// Setup Vite dev server or serve static dist in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ClinicScribe server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
