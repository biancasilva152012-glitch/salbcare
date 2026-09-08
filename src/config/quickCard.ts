/**
 * Conteúdo do SalbCare Quick Card.
 * Frases retiradas dos materiais da SalbCare Academy (Inglês para Atendimento em Saúde),
 * preservando as traduções já publicadas.
 * A categoria "emergencia" é gratuita. As demais ficam visíveis e bloqueadas.
 */
export type Phrase = { pt: string; en: string; es: string };

export type QuickCardCategory = {
  id: string;
  label: string;
  free: boolean;
  phrases: Phrase[];
};

export const QUICK_CARD_LANGS = [
  { code: "pt", label: "PT" },
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
] as const;

export type QuickCardLang = (typeof QUICK_CARD_LANGS)[number]["code"];

export const QUICK_CARD: QuickCardCategory[] = [
  {
    id: "emergencia",
    label: "Emergência",
    free: true,
    phrases: [
      { pt: "Você está bem?", en: "Are you okay?", es: "¿Está bien?" },
      { pt: "Consegue me ouvir?", en: "Can you hear me?", es: "¿Puede oírme?" },
      { pt: "Onde dói?", en: "Where does it hurt?", es: "¿Dónde le duele?" },
      { pt: "Fique calmo, eu vou te ajudar.", en: "Stay calm, I am going to help you.", es: "Mantenga la calma, voy a ayudarle." },
      { pt: "Você está com dificuldade para respirar?", en: "Are you having trouble breathing?", es: "¿Tiene dificultad para respirar?" },
      { pt: "Você bateu a cabeça?", en: "Did you hit your head?", es: "¿Se golpeó la cabeza?" },
      { pt: "Você desmaiou?", en: "Did you faint?", es: "¿Se desmayó?" },
      { pt: "Há quanto tempo isso começou?", en: "How long ago did this start?", es: "¿Cuánto tiempo hace que empezó?" },
      { pt: "Você toma algum medicamento?", en: "Do you take any medication?", es: "¿Toma algún medicamento?" },
      { pt: "Você tem alguma doença crônica?", en: "Do you have any chronic condition?", es: "¿Tiene alguna enfermedad crónica?" },
      { pt: "Vou chamar uma ambulância.", en: "I am going to call an ambulance.", es: "Voy a llamar una ambulancia." },
      { pt: "Você precisa ir ao hospital.", en: "You need to go to the hospital.", es: "Necesita ir al hospital." },
      { pt: "Tem alguém que eu possa avisar?", en: "Is there someone I can contact?", es: "¿Hay alguien a quien pueda avisar?" },
      { pt: "Qual é o seu nome completo?", en: "What is your full name?", es: "¿Cuál es su nombre completo?" },
      { pt: "Aguarde aqui, por favor.", en: "Please wait here.", es: "Espere aquí, por favor." },
    ],
  },
  {
    id: "dor",
    label: "Dor e sintomas",
    free: false,
    phrases: [
      { pt: "De zero a dez, qual é a sua dor?", en: "On a scale from zero to ten, how bad is your pain?", es: "De cero a diez, ¿cuánto le duele?" },
      { pt: "A dor é constante ou vai e volta?", en: "Is the pain constant or does it come and go?", es: "¿El dolor es constante o va y viene?" },
      { pt: "A dor irradia para outro lugar?", en: "Does the pain spread anywhere else?", es: "¿El dolor se irradia a otro lugar?" },
      { pt: "É uma dor em pontada ou em queimação?", en: "Is it a sharp pain or a burning pain?", es: "¿Es un dolor punzante o quemante?" },
      { pt: "Piora quando você se movimenta?", en: "Does it get worse when you move?", es: "¿Empeora cuando se mueve?" },
      { pt: "Está com febre?", en: "Do you have a fever?", es: "¿Tiene fiebre?" },
      { pt: "Sente náusea ou tontura?", en: "Do you feel nauseous or dizzy?", es: "¿Siente náuseas o mareo?" },
      { pt: "Você está dormindo bem?", en: "Are you sleeping well?", es: "¿Está durmiendo bien?" },
      { pt: "Isso já aconteceu antes?", en: "Has this happened before?", es: "¿Esto ya le pasó antes?" },
      { pt: "O que melhora a dor?", en: "What makes the pain better?", es: "¿Qué alivia el dolor?" },
    ],
  },
  {
    id: "alergia",
    label: "Alergia e medicação",
    free: false,
    phrases: [
      { pt: "Você tem alergia a algum medicamento?", en: "Are you allergic to any medication?", es: "¿Es alérgico a algún medicamento?" },
      { pt: "Você tem alergia a anestesia?", en: "Are you allergic to anesthesia?", es: "¿Es alérgico a la anestesia?" },
      { pt: "Você tem alergia a látex?", en: "Are you allergic to latex?", es: "¿Es alérgico al látex?" },
      { pt: "Está tomando anticoagulante?", en: "Are you taking blood thinners?", es: "¿Está tomando anticoagulantes?" },
      { pt: "Quantas vezes por dia você toma?", en: "How many times a day do you take it?", es: "¿Cuántas veces al día lo toma?" },
      { pt: "Vou receitar um analgésico.", en: "I am going to prescribe a painkiller.", es: "Voy a prescribir un analgésico." },
      { pt: "Tome um comprimido a cada oito horas.", en: "Take one tablet every eight hours.", es: "Tome una tableta cada ocho horas." },
      { pt: "Não tome com álcool.", en: "Do not take it with alcohol.", es: "No lo tome con alcohol." },
      { pt: "Se piorar, procure atendimento.", en: "If it gets worse, seek medical care.", es: "Si empeora, busque atención médica." },
      { pt: "Está grávida ou amamentando?", en: "Are you pregnant or breastfeeding?", es: "¿Está embarazada o amamantando?" },
    ],
  },
  {
    id: "exame",
    label: "Exame físico",
    free: false,
    phrases: [
      { pt: "Posso examinar você?", en: "May I examine you?", es: "¿Puedo examinarle?" },
      { pt: "Abra a boca, por favor.", en: "Open your mouth, please.", es: "Abra la boca, por favor." },
      { pt: "Respire fundo.", en: "Take a deep breath.", es: "Respire profundo." },
      { pt: "Deite aqui, por favor.", en: "Please lie down here.", es: "Acuéstese aquí, por favor." },
      { pt: "Levante o braço devagar.", en: "Raise your arm slowly.", es: "Levante el brazo despacio." },
      { pt: "Avise se sentir dor.", en: "Tell me if you feel pain.", es: "Dígame si siente dolor." },
      { pt: "Vou medir sua pressão.", en: "I am going to check your blood pressure.", es: "Voy a medir su presión." },
      { pt: "Relaxe os ombros.", en: "Relax your shoulders.", es: "Relaje los hombros." },
      { pt: "Consegue andar sem apoio?", en: "Can you walk without support?", es: "¿Puede caminar sin apoyo?" },
      { pt: "Terminamos, pode se sentar.", en: "We are done, you can sit up.", es: "Terminamos, puede sentarse." },
    ],
  },
  {
    id: "pagamento",
    label: "Pagamento e seguro",
    free: false,
    phrases: [
      { pt: "Você tem seguro de viagem?", en: "Do you have travel insurance?", es: "¿Tiene seguro de viaje?" },
      { pt: "Posso ver seu documento, por favor?", en: "May I see your ID, please?", es: "¿Puedo ver su documento, por favor?" },
      { pt: "A consulta custa este valor.", en: "The appointment costs this amount.", es: "La consulta cuesta este monto." },
      { pt: "Aceitamos cartão de crédito.", en: "We accept credit cards.", es: "Aceptamos tarjeta de crédito." },
      { pt: "Vou emitir um recibo para o seu seguro.", en: "I will issue a receipt for your insurance.", es: "Emitiré un recibo para su seguro." },
      { pt: "O pagamento é feito ao final da consulta.", en: "Payment is made at the end of the appointment.", es: "El pago se hace al final de la consulta." },
      { pt: "Quer agendar um retorno?", en: "Would you like to schedule a follow up?", es: "¿Desea agendar una consulta de control?" },
      { pt: "Envio as orientações por escrito.", en: "I will send the instructions in writing.", es: "Le enviaré las indicaciones por escrito." },
    ],
  },
];
