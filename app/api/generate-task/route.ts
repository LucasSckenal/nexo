import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const { title, projectType } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título é obrigatório' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Configuração de Persona e Exemplos baseada no contexto
    const isDesign = projectType === 'design';
    
    const contextRules = isDesign 
      ? `Persona: Senior Product Designer. 
         Foco: UX/UI, Figma, Design System, Prototipagem e Acessibilidade.
         Exemplos de Subtarefas: "Definir paleta de cores", "Criar componentes no Figma", "Validar contraste (WCAG)", "Prototipar fluxo de checkout".`
      : `Persona: Senior Fullstack Developer / Tech Lead. 
         Foco: Código limpo, Performance, Segurança, API e Banco de Dados.
         Exemplos de Subtarefas: "Criar migração da tabela X", "Implementar Zod validation", "Configurar endpoint POST /users", "Escrever testes unitários".`;

    const prompt = `
      [SISTEMA]
      Atue como um ${isDesign ? 'Designer' : 'Desenvolvedor'} Sênior. Sua missão é decompor um título de tarefa em uma descrição técnica curta e uma lista de subtarefas acionáveis (Checklist).

      [CONTEXTO DO PROJETO]
      ${contextRules}

      [REGRAS OBRIGATÓRIAS]
      1. Descrição: Máximo de 120 caracteres. Use tom técnico e direto.
      2. Subtarefas: De 3 a 8 itens no máximo. 
      3. Linguagem: Use verbos de ação no infinitivo (Criar, Ajustar, Testar).
      4. Proibido: Não use introduções como "Aqui está o seu plano", não use explicações teóricas e não use markdown (\`\`\`).
      5. Idioma: Português (PT-BR) ou Ingles conforme o input.

      [INPUT]
      Título da Tarefa: "${title}"

      [REGRAS ADICIONAIS]
      1. Story Points: Avalie a complexidade técnica e sugira um valor da sequência de Fibonacci (1, 2, 3, 5, 8).
         - 1-2: Tarefa simples, pouco risco.
         - 3-5: Complexidade média, envolve lógica ou múltiplos ficheiros.
         - 8: Tarefa complexa, integração de terceiros ou grande risco.

      [FORMATO DE SAÍDA - JSON PURO]
      {
        "description": "string",
        "subtasks": ["string"],
        "points": number
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    // Limpeza ultra-segura para garantir que o JSON.parse não falhe
    const cleanJson = responseText
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove caracteres de controle
      .trim();

    const data = JSON.parse(cleanJson);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Erro Gemini:', error);
    return NextResponse.json({ error: 'Falha na IA', details: error.message }, { status: 500 });
  }
}