/**
 * Conteúdo do SalbCare Quick Card.
 * Fonte: Apostila 01 (Inglês para Atendimento em Saúde) e Apostila 02 (Espanhol para
 * Atendimento em Saúde), da SalbCare Academy.
 * A categoria "emergencia" é gratuita (tier free). As outras ficam visíveis e bloqueadas
 * até a compra de uma das apostilas ou do pacote.
 */
export type Phrase = { pt: string; en: string; es: string };

export type QuickCardCategory = {
  id: string;
  label: string;
  tier: "free" | "paid";
  /** Atalho de leitura: true quando tier === "free". */
  free: boolean;
  description: string;
  phrases: Phrase[];
  vocabulary: Phrase[];
};

export const QUICK_CARD_LANGS = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
] as const;

export type QuickCardLang = (typeof QUICK_CARD_LANGS)[number]["code"];

/** Produto comprado na Academy e os idiomas que ele libera no Quick Card. */
export const QUICK_CARD_PRODUCTS: Record<string, { title: string; langs: QuickCardLang[] }> = {
  "ingles-para-atendimento-em-saude": { title: "Apostila de Inglês", langs: ["pt", "en"] },
  "espanhol-para-atendimento-em-saude": { title: "Apostila de Espanhol", langs: ["pt", "es"] },
  "international-healthcare-kit": { title: "International Healthcare Kit", langs: ["pt", "en", "es"] },
};

/** Idiomas liberados por uma lista de compras (slugs). Assinantes do PRO recebem todos. */
export const langsForSlugs = (slugs: string[]): QuickCardLang[] => {
  const set = new Set<QuickCardLang>();
  slugs.forEach((slug) => QUICK_CARD_PRODUCTS[slug]?.langs.forEach((l) => set.add(l)));
  return QUICK_CARD_LANGS.map((l) => l.code).filter((c) => set.has(c));
};

export const ALL_LANGS: QuickCardLang[] = ["pt", "en", "es"];

export const QUICK_CARD: QuickCardCategory[] = [
  {
    id: "emergencia",
    label: "Emergência",
    tier: "free",
    free: true,
    description: "Frases essenciais para situações urgentes, incluindo lesões de esportes aquáticos.",
    phrases: [
      { pt: "Chame uma ambulância, por favor!", en: "Call an ambulance, please!", es: "¡Llama a una ambulancia, por favor!" },
      { pt: "Fique calmo, a ajuda está a caminho", en: "Stay calm, help is on the way", es: "Mantén la calma, la ayuda va en camino" },
      { pt: "Você é alérgico a algum medicamento?", en: "Are you allergic to any medication?", es: "¿Eres alérgico a algún medicamento?" },
      { pt: "Não se mexa, vou te ajudar", en: "Don't move, I'm going to help you", es: "No te muevas, te voy a ayudar" },
      { pt: "Você consegue me dizer seu nome?", en: "Can you tell me your name?", es: "¿Puedes decirme tu nombre?" },
      { pt: "Precisamos ir ao hospital agora", en: "We need to go to the hospital now", es: "Necesitamos ir al hospital ahora" },
      { pt: "Onde dói mais?", en: "Where does it hurt the most?", es: "¿Dónde te duele más?" },
      { pt: "Vou ligar para seu contato de emergência", en: "I'm going to call your emergency contact", es: "Voy a llamar a tu contacto de emergencia" },
      { pt: "Tente não mover", en: "Try not to move it", es: "Trata de no moverlo" },
      { pt: "Quando aconteceu o acidente?", en: "When did the accident happen?", es: "¿Cuándo ocurrió el accidente?" },
      { pt: "Você ficou consciente o tempo todo?", en: "Were you conscious the whole time?", es: "¿Estuviste consciente todo el tiempo?" },
      { pt: "Precisamos imobilizar isso", en: "We need to immobilize this", es: "Necesitamos inmovilizar esto" },
      { pt: "Você sente tontura ou náusea?", en: "Do you feel dizzy or nauseous?", es: "¿Sientes mareo o náuseas?" },
      { pt: "Recomendamos ir ao hospital para um raio-x", en: "We recommend you go to the hospital for an X-ray", es: "Te recomendamos ir al hospital para una radiografía" },
      { pt: "Isso precisa de pontos", en: "This needs stitches", es: "Esto necesita puntos" },
    ],
    vocabulary: [
      { pt: "Ombro deslocado", en: "Dislocated shoulder", es: "Hombro dislocado" },
      { pt: "Torção no tornozelo", en: "Sprained ankle", es: "Esguince de tobillo" },
      { pt: "Corte de linha de kite", en: "Kite line burn / cut", es: "Corte de línea de kite" },
      { pt: "Picada de água-viva", en: "Jellyfish sting", es: "Picadura de medusa" },
      { pt: "Otite / ouvido do surfista", en: "Ear infection (surfer's ear)", es: "Otitis (oído del surfista)" },
      { pt: "Queimadura de sol / insolação", en: "Sunburn / heat exhaustion", es: "Quemadura de sol / insolación" },
      { pt: "Concussão / pancada na cabeça", en: "Concussion", es: "Conmoción cerebral" },
      { pt: "Distensão muscular", en: "Muscle strain", es: "Distensión muscular" },
    ],
  },
  {
    id: "dor-sintomas",
    label: "Dor e sintomas",
    tier: "paid",
    free: false,
    description: "Avaliação de dor, localização, intensidade e evolução dos sintomas.",
    phrases: [
      { pt: "Onde exatamente dói?", en: "Where exactly does it hurt?", es: "¿Dónde exactamente te duele?" },
      { pt: "Dói mais quando aperto aqui?", en: "Does it hurt more when you press here?", es: "¿Duele más cuando presiono aquí?" },
      { pt: "Há quanto tempo você está com essa dor?", en: "How long have you had this pain?", es: "¿Hace cuánto tienes este dolor?" },
      { pt: "Piora de manhã ou à noite?", en: "Is it worse in the morning or at night?", es: "¿Empeora por la mañana o por la noche?" },
      { pt: "Avalie sua dor de 0 a 10", en: "Rate your pain from 0 to 10", es: "Califica tu dolor del 0 al 10" },
      { pt: "Alguma coisa melhora ou piora?", en: "Does anything make it better or worse?", es: "¿Algo lo mejora o lo empeora?" },
      { pt: "A dor é constante, ou vai e volta?", en: "Is the pain constant, or does it come and go?", es: "¿El dolor es constante o va y viene?" },
      { pt: "Você consegue apontar exatamente onde dói?", en: "Can you point to exactly where it hurts?", es: "¿Puedes señalar exactamente dónde te duele?" },
    ],
    vocabulary: [
      { pt: "Dor aguda / dor surda", en: "Sharp / dull pain", es: "Dolor agudo / dolor sordo" },
      { pt: "Latejante", en: "Throbbing", es: "Palpitante" },
      { pt: "Inchaço", en: "Swelling", es: "Hinchazón" },
      { pt: "Hematoma / roxo", en: "Bruise", es: "Moretón" },
      { pt: "Dormência", en: "Numbness", es: "Adormecimiento" },
      { pt: "Sangramento", en: "Bleeding", es: "Sangrado" },
      { pt: "Vai e volta", en: "It comes and goes", es: "Va y viene" },
    ],
  },
  {
    id: "alergia-medicacao",
    label: "Alergia e medicação",
    tier: "paid",
    free: false,
    description: "Anamnese, histórico, alergias e orientações de prescrição.",
    phrases: [
      { pt: "Você já teve isso antes?", en: "Have you had this before?", es: "¿Has tenido esto antes?" },
      { pt: "Quando os sintomas começaram?", en: "When did the symptoms start?", es: "¿Cuándo comenzaron los síntomas?" },
      { pt: "Você está tomando algum medicamento?", en: "Are you currently taking any medication?", es: "¿Estás tomando algún medicamento actualmente?" },
      { pt: "Você tem alguma condição crônica?", en: "Do you have any chronic conditions?", es: "¿Tienes alguna condición crónica?" },
      { pt: "Tem mais alguma coisa que eu deva saber?", en: "Is there anything else I should know?", es: "¿Hay algo más que deba saber?" },
      { pt: "Tome um comprimido a cada X horas", en: "Take one pill every X hours", es: "Toma una pastilla cada X horas" },
      { pt: "Evite nadar ou andar de kite por alguns dias", en: "Avoid swimming or kiting for a few days", es: "Evita nadar o hacer kite por unos días" },
      { pt: "Se os sintomas não melhorarem, vá ao pronto-socorro", en: "If symptoms don't improve, go to the ER", es: "Si los síntomas no mejoran, ve a urgencias" },
      { pt: "Mantenha a área limpa e seca", en: "Keep the area clean and dry", es: "Mantén el área limpia y seca" },
      { pt: "Me ligue se tiver algum problema", en: "Call me if you have any issues", es: "Llámame si tienes algún problema" },
    ],
    vocabulary: [
      { pt: "Tomar com / sem comida", en: "Take with / without food", es: "Tomar con / sin comida" },
      { pt: "A cada 8 / 12 horas", en: "Every 8 / 12 hours", es: "Cada 8 / 12 horas" },
      { pt: "Evite álcool", en: "Avoid alcohol", es: "Evita el alcohol" },
      { pt: "Grávida / amamentando", en: "Pregnant / breastfeeding", es: "Embarazada / lactando" },
      { pt: "Volte se piorar", en: "Come back if it gets worse", es: "Vuelve si empeora" },
      { pt: "Retorno em X dias", en: "Follow-up in X days", es: "Seguimiento en X días" },
    ],
  },
  {
    id: "exame-fisico",
    label: "Exame físico",
    tier: "paid",
    free: false,
    description: "Comandos curtos e claros para conduzir o exame.",
    phrases: [
      { pt: "Vou examinar a área agora, tudo bem?", en: "I'm going to examine the area now, is that okay?", es: "Voy a examinar el área ahora, ¿está bien?" },
      { pt: "Me avise se isso doer", en: "Tell me if this hurts", es: "Avísame si esto te duele" },
      { pt: "Você consegue mover isso para mim?", en: "Can you move this for me?", es: "¿Puedes mover esto para mí?" },
      { pt: "Aperte minha mão", en: "Squeeze my hand", es: "Aprieta mi mano" },
      { pt: "Siga meu dedo com os olhos", en: "Follow my finger with your eyes", es: "Sigue mi dedo con los ojos" },
      { pt: "Me avise se sentir diferente", en: "Let me know if it feels different", es: "Avísame si se siente diferente" },
      { pt: "Já estou terminando", en: "I'm almost done", es: "Ya casi termino" },
      { pt: "Você foi ótimo, obrigado", en: "You did great, thank you", es: "Lo hiciste muy bien, gracias" },
    ],
    vocabulary: [
      { pt: "Abra a boca", en: "Open your mouth", es: "Abre la boca" },
      { pt: "Respire fundo", en: "Take a deep breath", es: "Respira profundo" },
      { pt: "Fique parado(a)", en: "Hold still", es: "Quédate quieto(a)" },
      { pt: "Deite / sente-se", en: "Lie down / sit up", es: "Acuéstate / siéntate" },
      { pt: "Dobre o joelho / cotovelo", en: "Bend your knee / elbow", es: "Dobla la rodilla / el codo" },
      { pt: "Isso dói?", en: "Does this hurt?", es: "¿Esto duele?" },
      { pt: "Relaxe", en: "Relax", es: "Relájate" },
      { pt: "Vou tocar aqui", en: "I'm going to touch here", es: "Voy a tocar aquí" },
    ],
  },
  {
    id: "pagamento-seguro",
    label: "Pagamento e seguro",
    tier: "paid",
    free: false,
    description: "Valores, formas de pagamento, recibo para seguro viagem e despedida.",
    phrases: [
      { pt: "Como você prefere pagar?", en: "How would you like to pay?", es: "¿Cómo prefieres pagar?" },
      { pt: "Vou te dar um recibo detalhado para seu seguro", en: "I'll give you a detailed receipt for your insurance", es: "Te daré un recibo detallado para tu seguro" },
      { pt: "Aqui está meu WhatsApp caso precise de algo", en: "Here's my WhatsApp in case you need anything", es: "Aquí está mi WhatsApp por si necesitas algo" },
      { pt: "Foi um prazer cuidar de você", en: "It was a pleasure taking care of you", es: "Fue un placer cuidarte" },
      { pt: "Aproveite o resto da viagem", en: "Enjoy the rest of your trip", es: "Disfruta el resto de tu viaje" },
      { pt: "O total da consulta de hoje é X reais", en: "The total for today's visit is X reais", es: "El total de la consulta de hoy es X reales" },
      { pt: "Se cuide, e não hesite em entrar em contato", en: "Take care, and don't hesitate to reach out", es: "Cuídate, y no dudes en contactarme" },
    ],
    vocabulary: [
      { pt: "Valor total", en: "Total amount", es: "Monto total" },
      { pt: "Dinheiro / cartão / Pix", en: "Cash / card / Pix", es: "Efectivo / tarjeta / Pix" },
      { pt: "Recibo", en: "Receipt", es: "Recibo" },
      { pt: "Reembolso do seguro", en: "Insurance reimbursement", es: "Reembolso del seguro" },
      { pt: "Laudo médico", en: "Medical report", es: "Informe médico" },
      { pt: "Melhoras", en: "Get well soon", es: "Que te mejores" },
      { pt: "Se cuide", en: "Take care", es: "Cuídate" },
    ],
  },
];
