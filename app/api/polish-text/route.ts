import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Texto é obrigatório' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Pedimos para a IA agir como um revisor profissional
    const prompt = `
      Você é um revisor de texto profissional de uma equipe de tecnologia/design.
      Sua tarefa é corrigir erros ortográficos, melhorar a gramática e deixar o tom do texto mais claro, profissional e educado, sem alterar o sentido original.
      Mantenha o idioma em Português do Brasil (pt-BR).
      Texto original: "${text}"
      
      Retorne APENAS o texto revisado e melhorado. Não adicione aspas, nem explicações ou formatação markdown em volta.
    `;

    const result = await model.generateContent(prompt);
    const polishedText = result.response.text().trim();

    return NextResponse.json({ polishedText });
  } catch (error) {
    console.error('Erro na API de Polish:', error);
    return NextResponse.json({ error: 'Erro ao melhorar texto' }, { status: 500 });
  }
}