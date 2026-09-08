/**
 * Casos clínicos do jogo gratuito da SalbCare Academy.
 * Dois casos liberados (um em inglês, um em espanhol), cinco cenas cada.
 * O progresso do jogo gratuito vive apenas em estado local (React).
 */

export type Verdict = "correct" | "near" | "wrong";

export interface ChoiceOption {
  text: string;
  verdict: Verdict;
  /** Fala curta do paciente reagindo à escolha. */
  reaction: string;
  /** Por que a resposta não funcionaria em um atendimento real. */
  hint?: string;
}

export type Exercise =
  | {
      kind: "choice";
      /** Fala do paciente que será lida em voz alta (exercício de escuta). */
      audio?: string;
      /** Segundos para responder, usado em cenas de urgência. */
      seconds?: number;
      options: ChoiceOption[];
    }
  | {
      kind: "order";
      words: string[];
      answer: string;
      reaction: string;
      hint: string;
    }
  | {
      kind: "gap";
      before: string;
      after: string;
      options: string[];
      answer: string;
      reaction: string;
      hint: string;
    };

export interface Scene {
  id: string;
  step: string;
  /** Situação escrita em português. */
  situation: string;
  exercise: Exercise;
}

export interface GameCase {
  id: string;
  language: "en" | "es";
  languageLabel: string;
  speechLocale: string;
  patientName: string;
  avatar: "sarah" | "mateo";
  headline: string;
  context: string;
  scenes: Scene[];
}

export const SCENE_STEPS = ["Recepção", "Ficha", "Atendimento", "Orientação", "Pagamento"] as const;

export const GAME_CASES: GameCase[] = [
  {
    id: "sarah-dor-de-dente",
    language: "en",
    languageLabel: "Inglês",
    speechLocale: "en-US",
    patientName: "Sarah",
    avatar: "sarah",
    headline: "Sarah, turista americana, chegou com dor de dente às 18h",
    context:
      "Ela está viajando pelo litoral, não fala português e sente uma dor pulsante do lado direito desde o almoço.",
    scenes: [
      {
        id: "recepcao",
        step: "Recepção",
        situation: "A paciente acabou de sentar. Cumprimente e confirme o nome dela.",
        exercise: {
          kind: "choice",
          options: [
            {
              text: "Good evening. Am I speaking with Sarah Miller?",
              verdict: "correct",
              reaction: "Yes, my name is Sarah Miller. Thank you for seeing me so late.",
            },
            {
              text: "Hello. What is your name here?",
              verdict: "near",
              reaction: "Sorry, I didn't quite catch that.",
              hint: "A pergunta soa truncada. Prefira confirmar o nome que já está na ficha.",
            },
            {
              text: "Sit down, name please.",
              verdict: "wrong",
              reaction: "Oh... okay.",
              hint: "Sem saudação e no imperativo, a frase soa como ordem. O primeiro contato define a confiança do paciente.",
            },
          ],
        },
      },
      {
        id: "ficha",
        step: "Ficha",
        situation: "Você precisa saber se ela tem alergia a algum medicamento. Complete a pergunta.",
        exercise: {
          kind: "gap",
          before: "Do you have any",
          after: "to medication?",
          options: ["allergies", "illness", "problems"],
          answer: "allergies",
          reaction: "Only penicillin. It gives me a rash.",
          hint: "Alergia medicamentosa é sempre allergies. Illness é doença e problems é vago demais para a ficha.",
        },
      },
      {
        id: "atendimento",
        step: "Atendimento",
        situation: "Ouça o que a paciente diz sobre a dor e escolha o que ela relatou.",
        exercise: {
          kind: "choice",
          audio: "The pain started after lunch and it gets worse when I drink something cold.",
          options: [
            {
              text: "A dor começou depois do almoço e piora com bebida fria",
              verdict: "correct",
              reaction: "Exactly. Cold water is the worst part.",
            },
            {
              text: "A dor começou de manhã e piora ao mastigar",
              verdict: "near",
              reaction: "No, not really when I chew.",
              hint: "Ela citou bebida fria, não mastigação. Sensibilidade ao frio muda a hipótese clínica.",
            },
            {
              text: "A dor é constante desde ontem e não muda com nada",
              verdict: "wrong",
              reaction: "That's not what I said.",
              hint: "Registrar o relato errado no prontuário compromete o diagnóstico e a confiança da paciente.",
            },
          ],
        },
      },
      {
        id: "orientacao",
        step: "Orientação",
        situation: "Monte a frase para explicar que hoje você vai aliviar a dor e o tratamento definitivo fica para o retorno.",
        exercise: {
          kind: "order",
          words: ["Today", "we", "will", "relieve", "the", "pain"],
          answer: "Today we will relieve the pain",
          reaction: "That's a relief. I can come back on Friday.",
          hint: "A ordem natural é sujeito, verbo auxiliar e depois o verbo principal.",
        },
      },
      {
        id: "pagamento",
        step: "Pagamento",
        situation: "Ela pergunta como pagar. Você tem 10 segundos para responder com naturalidade.",
        exercise: {
          kind: "choice",
          seconds: 10,
          options: [
            {
              text: "You can pay by card or bank transfer. Would you like a receipt for your insurance?",
              verdict: "correct",
              reaction: "Card, please. And yes, I need the receipt.",
            },
            {
              text: "Card is possible. Receipt maybe later.",
              verdict: "near",
              reaction: "So... can I have the receipt or not?",
              hint: "Deixar o recibo em aberto gera insegurança, sobretudo com plano internacional.",
            },
            {
              text: "Money now, no papers.",
              verdict: "wrong",
              reaction: "That makes me uncomfortable.",
              hint: "Recusar comprovante soa como falta de transparência e impede o reembolso do seguro dela.",
            },
          ],
        },
      },
    ],
  },
  {
    id: "mateo-ombro",
    language: "es",
    languageLabel: "Espanhol",
    speechLocale: "es-ES",
    patientName: "Mateo",
    avatar: "mateo",
    headline: "Mateo, kitesurfista argentino, torceu o ombro na praia",
    context: "Ele caiu durante uma manobra, chegou direto da praia e não consegue levantar o braço acima do ombro.",
    scenes: [
      {
        id: "recepcao",
        step: "Recepção",
        situation: "O paciente entra com o braço junto ao corpo. Cumprimente e confirme quem é.",
        exercise: {
          kind: "choice",
          options: [
            {
              text: "Buenas tardes. ¿Usted es Mateo Ferreyra?",
              verdict: "correct",
              reaction: "Sí, soy Mateo. Gracias por atenderme.",
            },
            {
              text: "Hola. ¿Cómo te llamas otra vez?",
              verdict: "near",
              reaction: "Perdón, ¿no tiene mis datos?",
              hint: "Perguntar o nome de novo passa a impressão de desorganização. Confirme o nome da ficha.",
            },
            {
              text: "Siéntate ahí y espera.",
              verdict: "wrong",
              reaction: "Bueno...",
              hint: "Sem saudação e no imperativo, a frase soa fria com alguém com dor.",
            },
          ],
        },
      },
      {
        id: "ficha",
        step: "Ficha",
        situation: "Pergunte se ele está tomando algum medicamento. Complete a frase.",
        exercise: {
          kind: "gap",
          before: "¿Está tomando algún",
          after: "en este momento?",
          options: ["medicamento", "problema", "dolor"],
          answer: "medicamento",
          reaction: "Solo un analgésico que compré en la farmacia.",
          hint: "Medicamento é o termo da ficha. Problema e dolor não respondem à pergunta sobre uso de remédio.",
        },
      },
      {
        id: "atendimento",
        step: "Atendimento",
        situation: "Ouça o relato e escolha o que ele disse.",
        exercise: {
          kind: "choice",
          audio: "Me caí en el agua y no puedo levantar el brazo por encima del hombro.",
          options: [
            {
              text: "Caiu na água e não consegue levantar o braço acima do ombro",
              verdict: "correct",
              reaction: "Sí, justo eso. Duele mucho al intentarlo.",
            },
            {
              text: "Caiu na areia e sente formigamento na mão",
              verdict: "near",
              reaction: "No, en la mano no siento nada raro.",
              hint: "Formigamento sugere outra hipótese. Confirme sempre o mecanismo do trauma.",
            },
            {
              text: "Bateu a cabeça e está com tontura",
              verdict: "wrong",
              reaction: "No dije eso, me preocupa que no me entienda.",
              hint: "Trocar o mecanismo do trauma leva a conduta errada e assusta o paciente.",
            },
          ],
        },
      },
      {
        id: "orientacao",
        step: "Orientação",
        situation: "Monte a frase para orientar gelo por vinte minutos, três vezes ao dia.",
        exercise: {
          kind: "order",
          words: ["Aplique", "hielo", "veinte", "minutos", "tres", "veces", "al", "día"],
          answer: "Aplique hielo veinte minutos tres veces al día",
          reaction: "Perfecto, lo hago desde hoy.",
          hint: "Comece pelo verbo de orientação e depois a quantidade e a frequência.",
        },
      },
      {
        id: "pagamento",
        step: "Pagamento",
        situation: "Ele quer saber quanto é e se pode voltar. Você tem 10 segundos.",
        exercise: {
          kind: "choice",
          seconds: 10,
          options: [
            {
              text: "Puede pagar con tarjeta. Le doy el comprobante y agendamos el control.",
              verdict: "correct",
              reaction: "Gracias, vuelvo el jueves entonces.",
            },
            {
              text: "Tarjeta sí. El control después vemos.",
              verdict: "near",
              reaction: "¿Entonces vuelvo o no?",
              hint: "Deixar o retorno indefinido faz o paciente abandonar o tratamento.",
            },
            {
              text: "Efectivo y sin comprobante.",
              verdict: "wrong",
              reaction: "Eso no me deja tranquilo.",
              hint: "Sem comprovante ele não consegue reembolso do seguro de viagem.",
            },
          ],
        },
      },
    ],
  },
];

/** Casos que só abrem com a compra. Títulos legíveis, conteúdo borrado. */
export const LOCKED_CASES = [
  "Emergência: paciente com sangramento ativo",
  "Criança acompanhada dos pais",
  "Paciente com plano internacional",
  "Retorno pós-procedimento",
  "Paciente ansioso antes da anestesia",
  "Idoso com múltiplas medicações",
  "Cancelamento e reagendamento por telefone",
  "Orientação de pós-operatório por escrito",
];

export const UNLOCK_PRICE = "R$ 39,90";

export const CONFIDENCE_START = 70;
export const CONFIDENCE_UP = 8;
export const CONFIDENCE_NEAR = -6;
export const CONFIDENCE_WRONG = -14;

export const sealFor = (confidence: number) =>
  confidence >= 85 ? "Atendimento impecável" : confidence >= 65 ? "Bom atendimento" : "Deu para se virar";
