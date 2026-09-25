# Evolução da Agenda SalbCare

## O que existe hoje
- Uma página de Agenda (`/dashboard/agenda`) com lista de consultas, busca de paciente e modo visitante.
- Tabela `appointments` com paciente, data, hora, tipo, status e notas (sem duração, sala, unidade ou recorrência).
- Links de WhatsApp (`wa.me`) já usados em vários lugares, sem histórico de envio.
- Página pública de agendamento (`/agendar/...`) e horários em `profiles.available_hours`.
- Nada disso será removido: a Agenda evolui por cima do que já funciona.

## Limite importante: WhatsApp automático
Para enviar mensagens **sozinho** (sem o profissional tocar em nada), é preciso uma conta oficial do WhatsApp Business API, com número verificado pela Meta. Isso você ainda não tem.

Até lá, sem simular nada:
- "Enviar confirmação pelo WhatsApp" abre o WhatsApp do profissional com a mensagem pronta. É só tocar em enviar.
- Cada envio fica registrado no histórico da consulta.
- A opção "Enviar automaticamente" e os lembretes (24h e 2h) já ficam salvos e agendados. Quando a conta oficial estiver ligada, passam a sair sozinhos. Antes disso, a Agenda mostra "Lembretes para enviar hoje", com um toque para enviar cada um.
- Confirmação do paciente: por enquanto o profissional marca "Confirmado" com um toque quando o paciente responder. Com a API oficial, isso pode passar a ser automático.

## Fases (em ordem de prioridade)
1. **Agenda funcional e agendamento futuro**
   - Visualizações Dia, Semana e Mês. Botão "Hoje", navegação entre meses, busca por paciente.
   - No celular: dia em lista de horários, deslizar entre dias e botão flutuante "+".
   - Toque num horário livre abre "Novo agendamento" já preenchido. Dá para escolher paciente existente ou criar um novo ali mesmo.
   - Duração e horário final, os 8 status pedidos e aviso de conflito com sugestão dos próximos horários livres.
   - Indicadores do dia: consultas, confirmadas, aguardando, canceladas, faltas, próximo paciente e próximo horário livre.
2. **Painel da consulta**: confirmar, remarcar (oferece a mensagem de remarcação), cancelar, atendido, falta, editar, enviar WhatsApp, ver paciente, histórico.
3. **Horário de funcionamento e bloqueios**: dias, horários, almoço, intervalo, duração padrão, feriados, férias e exceções. Bloqueios (almoço, reunião, férias etc.) aparecem riscados na grade.
4. **Profissionais, salas e unidades**: cadastro simples. Filtros por profissional, especialidade, sala, unidade e status. Conflito checado por profissional, sala e unidade.
5. **WhatsApp e lembretes**: modelos das mensagens de confirmação, lembrete e remarcação, preferências de envio automático e fila de lembretes (como descrito acima).
6. **Recorrência**: diária, semanal, quinzenal ou mensal, até uma data ou por quantidade. As consultas são geradas na agenda de uma vez.
7. **Acabamento visual**: grade limpa e espaçada, pouca cor (cor só no status), testado em 360, 390 e 1440 px.

## Mudanças no banco (precisam da sua aprovação)
Novas tabelas, cada uma visível só para o próprio profissional (e para administradores):
- `clinic_units`, `clinic_rooms`, `clinic_staff` (profissionais da clínica)
- `schedule_settings` (horários, duração, almoço, preferências de WhatsApp e lembretes)
- `blocked_times`
- `appointment_reminders`, `appointment_notifications`, `appointment_history`
- `appointment_series` (recorrência)

Na tabela `appointments`, só colunas novas e opcionais: horário final ou duração, sala, unidade, profissional da clínica, especialidade, telefone, status de confirmação e série. Nenhuma coluna existente será alterada. As regras de acesso atuais continuam como estão.

## Detalhes técnicos
- Componentes em `src/components/agenda/`: CalendarView (Day/Week/Month/MobileDay), AppointmentModal, AppointmentCard, AppointmentDetailSheet, PatientSelector, ProfessionalSelector, WhatsAppConfirmation, ReminderSettings, RecurringAppointment, BlockedTime, ScheduleSettings, AgendaStats.
- `src/services/whatsapp/`: interface `WhatsAppProvider`, `DeepLinkProvider` (atual, wa.me) e `BusinessApiProvider`. Esta última fica como esqueleto até existir a conta oficial. Os modelos de mensagem ficam num lugar só.
- Histórico gravado por trigger no banco (criação, alterações, remarcação, cancelamento, confirmação), mais registros de envio vindos do app.
- Conflitos e horários livres calculados num módulo puro (`src/lib/agenda/availability.ts`), com testes.
- Mensagens para o paciente mantêm os emojis que você enviou. A interface do app continua sem emojis e sem travessão.
- Sem novas dependências. React Query e cliente existentes.
