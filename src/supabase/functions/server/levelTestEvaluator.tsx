/**
 * LEVEL TEST EVALUATOR - Sistema de Evaluación con IA
 * =====================================================
 * Evalúa el Test de Nivel usando Groq (IA) y envía notificaciones por email
 */

import Groq from 'npm:groq-sdk';

interface TestAnswer {
  questionId: number;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface EvaluationRequest {
  studentId: string;
  studentName: string;
  studentEmail: string;
  teacherEmail: string;
  answers: TestAnswer[];
  writingText: string;
  rawScore: number;
  totalQuestions: number;
}

interface EvaluationResult {
  level: string; // A1, A2, B1, B2, C1, C2
  percentage: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string;
}

/**
 * Evalúa el test de nivel con IA
 */
export async function evaluateLevelTest(request: EvaluationRequest): Promise<EvaluationResult> {
  console.log('🎯 Iniciando evaluación de Test de Nivel para:', request.studentName);

  const groq = new Groq({
    apiKey: Deno.env.get('GROQ_API_KEY'),
  });

  // 1. CALCULAR MÉTRICAS BÁSICAS
  const percentage = (request.rawScore / request.totalQuestions) * 100;
  const incorrectAnswers = request.answers.filter(a => !a.isCorrect);
  
  // 2. CONSTRUIR EL PROMPT PARA LA IA
  const systemPrompt = `Eres un evaluador experto del Instituto Cervantes especializado en determinar niveles CEFR (A1-C2) para estudiantes de español como lengua extranjera.

Tu tarea es analizar los resultados de un test de nivel que consta de:
1. 75 preguntas de opción múltiple (gramática, vocabulario, comprensión)
2. Una redacción escrita en español

CRITERIOS DE EVALUACIÓN CEFR:
- **A1**: 0-20% correcto. Nivel básico, vocabulario elemental, errores frecuentes.
- **A2**: 21-40% correcto. Nivel elemental, estructuras simples, comunicación básica.
- **B1**: 41-55% correcto. Nivel intermedio, maneja situaciones cotidianas, errores ocasionales.
- **B2**: 56-70% correcto. Nivel intermedio-alto, fluidez considerable, pocos errores.
- **C1**: 71-85% correcto. Nivel avanzado, dominio completo de estructuras complejas.
- **C2**: 86-100% correcto. Nivel maestría, precisión casi nativa.

Debes proporcionar:
1. **Nivel CEFR determinado** (A1, A2, B1, B2, C1, C2)
2. **Feedback motivador** (2-3 oraciones positivas y constructivas)
3. **Fortalezas** (3 puntos específicos basados en respuestas correctas)
4. **Áreas de mejora** (3 puntos específicos basados en errores)
5. **Recomendaciones** (2-3 sugerencias concretas de estudio)

RESPONDE EN FORMATO JSON:
{
  "level": "B1",
  "feedback": "...",
  "strengths": ["punto 1", "punto 2", "punto 3"],
  "weaknesses": ["punto 1", "punto 2", "punto 3"],
  "recommendations": "..."
}`;

  const userPrompt = `ESTUDIANTE: ${request.studentName}

RESULTADOS DEL TEST:
- Nota: ${request.rawScore}/${request.totalQuestions} (${percentage.toFixed(1)}%)
- Preguntas incorrectas: ${incorrectAnswers.length}

ERRORES COMETIDOS (Muestra):
${incorrectAnswers.slice(0, 10).map(a => 
  `• Pregunta ${a.questionId}: "${a.questionText}"
  Respuesta del estudiante: ${a.studentAnswer}
  Respuesta correcta: ${a.correctAnswer}`
).join('\n')}

${incorrectAnswers.length > 10 ? `\n... y ${incorrectAnswers.length - 10} errores más.` : ''}

REDACCIÓN ESCRITA:
"""
${request.writingText}
"""

Por favor, evalúa el nivel CEFR de este estudiante y proporciona feedback detallado en formato JSON.`;

  try {
    // 3. LLAMAR A LA IA (GROQ)
    console.log('🤖 Consultando a Groq AI...');
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '{}';
    console.log('✅ Respuesta de IA recibida');

    // 4. PARSEAR LA RESPUESTA
    let aiResult: EvaluationResult;
    try {
      aiResult = JSON.parse(rawResponse);
    } catch (parseError) {
      console.error('❌ Error al parsear respuesta de IA:', parseError);
      // Fallback con reglas heurísticas simples
      aiResult = {
        level: determineLevelByPercentage(percentage),
        percentage,
        feedback: 'Has completado el test correctamente. Te enviaremos más detalles pronto.',
        strengths: ['Completaste todas las preguntas', 'Mostraste interés en mejorar', 'Redacción entregada'],
        weaknesses: ['Revisar gramática básica', 'Practicar vocabulario', 'Mejorar conjugaciones'],
        recommendations: 'Continúa practicando con ejercicios interactivos y tareas de escritura.'
      };
    }

    // 5. ASEGURAR QUE EL NIVEL SEA VÁLIDO
    const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!validLevels.includes(aiResult.level)) {
      aiResult.level = determineLevelByPercentage(percentage);
    }

    aiResult.percentage = percentage;

    console.log(`✅ Nivel determinado: ${aiResult.level} (${percentage.toFixed(1)}%)`);

    // 6. ENVIAR NOTIFICACIONES POR EMAIL
    await sendEmailNotifications(request, aiResult);

    return aiResult;

  } catch (error) {
    console.error('❌ Error en evaluación con IA:', error);
    
    // FALLBACK: Evaluación basada solo en porcentaje
    const fallbackResult: EvaluationResult = {
      level: determineLevelByPercentage(percentage),
      percentage,
      feedback: `Has obtenido un ${percentage.toFixed(1)}% en el test. ¡Buen trabajo! Sigue practicando para mejorar.`,
      strengths: [
        'Completaste el test completo',
        `Respondiste correctamente ${request.rawScore} de ${request.totalQuestions} preguntas`,
        'Entregaste la redacción escrita'
      ],
      weaknesses: [
        'Revisar las áreas con más errores',
        'Practicar estructuras gramaticales',
        'Ampliar vocabulario'
      ],
      recommendations: 'Te recomendamos hacer ejercicios específicos de tu nivel y practicar conversación.'
    };

    await sendEmailNotifications(request, fallbackResult);
    return fallbackResult;
  }
}

/**
 * Determina el nivel CEFR basado en el porcentaje
 */
function determineLevelByPercentage(percentage: number): string {
  if (percentage >= 86) return 'C2';
  if (percentage >= 71) return 'C1';
  if (percentage >= 56) return 'B2';
  if (percentage >= 41) return 'B1';
  if (percentage >= 21) return 'A2';
  return 'A1';
}

/**
 * Envía las notificaciones por email usando Resend API directamente
 */
async function sendEmailNotifications(
  request: EvaluationRequest,
  result: EvaluationResult
): Promise<void> {
  console.log('📧 Enviando notificaciones por email...');
  
  const RESEND_KEY = Deno.env.get('RESEND_API_KEY') || "re_d6oDB5rh_6EHLuWjQxqzWiXtJxmjcM2kB";

  // PLANTILLA HTML PARA EL EMAIL
  const studentEmailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #F0F4F8; }
        .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6344A6 0%, #8B6BC7 100%); padding: 40px 30px; text-align: center; }
        .logo { font-size: 32px; font-weight: 900; color: white; margin-bottom: 10px; }
        .header-subtitle { color: rgba(255,255,255,0.9); font-size: 14px; }
        .content { padding: 40px 30px; }
        .level-badge { display: inline-block; background: linear-gradient(135deg, #F2B705 0%, #F28705 100%); color: white; padding: 12px 24px; border-radius: 12px; font-size: 32px; font-weight: 900; margin: 20px 0; letter-spacing: 2px; }
        .score { font-size: 18px; color: #64748b; margin: 10px 0; }
        .section { margin: 30px 0; }
        .section-title { font-size: 14px; font-weight: 800; color: #6344A6; text-transform: uppercase; margin-bottom: 10px; }
        .feedback { background: #F0F4F8; padding: 20px; border-radius: 12px; color: #334155; line-height: 1.6; }
        .list { margin: 10px 0; padding-left: 0; list-style: none; }
        .list li { padding: 8px 0; padding-left: 24px; position: relative; color: #475569; }
        .list li:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
        .weaknesses li:before { content: "⚠"; color: #f59e0b; }
        .footer { background: #F0F4F8; padding: 30px; text-align: center; color: #64748b; font-size: 12px; }
        .button { display: inline-block; background: #6344A6; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🎯 LuinGo</div>
          <div class="header-subtitle">Resultados de tu Test de Nivel</div>
        </div>
        
        <div class="content">
          <h1 style="color: #1e293b; margin: 0 0 10px 0;">¡Hola, ${request.studentName}! 👋</h1>
          <p style="color: #64748b; margin: 0 0 30px 0;">Has completado el Test de Nivel Oficial. Aquí están tus resultados:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div class="level-badge">${result.level}</div>
            <div class="score">Nota: ${result.percentage.toFixed(1)}% (${request.rawScore}/${request.totalQuestions})</div>
          </div>

          <div class="section">
            <div class="section-title">📝 Evaluación General</div>
            <div class="feedback">${result.feedback}</div>
          </div>

          <div class="section">
            <div class="section-title">💪 Tus Fortalezas</div>
            <ul class="list">
              ${result.strengths.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">🎯 Áreas de Mejora</div>
            <ul class="list weaknesses">
              ${result.weaknesses.map(w => `<li>${w}</li>`).join('')}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">📚 Recomendaciones</div>
            <div class="feedback">${result.recommendations}</div>
          </div>

          <div style="text-align: center; margin: 40px 0;">
            <p style="color: #64748b; margin-bottom: 10px;">¡Sigue aprendiendo en LuinGo!</p>
          </div>
        </div>

        <div class="footer">
          <p style="margin: 5px 0;">© ${new Date().getFullYear()} LuinGo - Plataforma de Aprendizaje de Español</p>
          <p style="margin: 5px 0;">Este email fue generado automáticamente. No respondas a este mensaje.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  // EMAIL AL ESTUDIANTE
  try {
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${RESEND_KEY}` 
      },
      body: JSON.stringify({ 
        from: "LuinGo <hola@luingo.es>", 
        to: request.studentEmail, 
        subject: `🎯 Resultados de tu Test de Nivel - Nivel ${result.level}`, 
        html: studentEmailHTML 
      }),
    });
    
    if (emailResponse.ok) {
      console.log('✅ Email enviado al estudiante:', request.studentEmail);
    } else {
      const errorData = await emailResponse.json();
      console.error('❌ Error de Resend (estudiante):', errorData);
    }
  } catch (emailError) {
    console.error('❌ Error al enviar email al estudiante:', emailError);
  }

  // EMAIL AL PROFESOR (COPIA)
  const teacherEmailHTML = studentEmailHTML.replace(
    `¡Hola, ${request.studentName}!`,
    `Resultados del Test de Nivel de ${request.studentName}`
  );

  try {
    const teacherEmailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${RESEND_KEY}` 
      },
      body: JSON.stringify({ 
        from: "LuinGo <hola@luingo.es>", 
        to: request.teacherEmail, 
        subject: `📊 Test de Nivel Completado: ${request.studentName} - Nivel ${result.level}`, 
        html: teacherEmailHTML 
      }),
    });
    
    if (teacherEmailResponse.ok) {
      console.log('✅ Email enviado al profesor:', request.teacherEmail);
    } else {
      const errorData = await teacherEmailResponse.json();
      console.error('❌ Error de Resend (profesor):', errorData);
    }
  } catch (emailError) {
    console.error('❌ Error al enviar email al profesor:', emailError);
  }
}
