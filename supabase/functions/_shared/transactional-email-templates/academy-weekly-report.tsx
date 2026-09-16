import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Row,
  Column,
  Section,
  Text,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface SubscriptionRow {
  plan?: string
  status?: string
  renewsOn?: string
}

interface Props {
  periodLabel?: string
  purchases?: number
  revenue?: string
  activeSubscriptions?: number
  subscriptions?: SubscriptionRow[]
  purchasesByProduct?: { title: string; count: number }[]
}

const Email = ({
  periodLabel = 'ultimos 7 dias',
  purchases = 0,
  revenue = 'R$ 0,00',
  activeSubscriptions = 0,
  subscriptions = [],
  purchasesByProduct = [],
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{`Academy: ${purchases} compras, ${revenue}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Relatorio semanal SalbCare</Heading>
        <Text style={muted}>Periodo: {periodLabel}</Text>

        <Section style={card}>
          <Row>
            <Column>
              <Text style={label}>Compras da Academy</Text>
              <Text style={value}>{purchases}</Text>
            </Column>
            <Column>
              <Text style={label}>Valor total</Text>
              <Text style={value}>{revenue}</Text>
            </Column>
            <Column>
              <Text style={label}>Assinaturas ativas</Text>
              <Text style={value}>{activeSubscriptions}</Text>
            </Column>
          </Row>
        </Section>

        <Heading as="h2" style={h2}>Compras por material</Heading>
        {purchasesByProduct.length === 0 ? (
          <Text style={muted}>Nenhuma compra neste periodo.</Text>
        ) : (
          purchasesByProduct.map((p) => (
            <Text key={p.title} style={line}>
              {p.title}: {p.count}
            </Text>
          ))
        )}

        <Hr style={hr} />

        <Heading as="h2" style={h2}>Assinaturas e vencimentos</Heading>
        {subscriptions.length === 0 ? (
          <Text style={muted}>Nenhuma assinatura registrada.</Text>
        ) : (
          subscriptions.map((s, i) => (
            <Text key={i} style={line}>
              {s.plan ?? 'plano'} | {s.status ?? 'sem status'} | renova em {s.renewsOn ?? 'data nao informada'}
            </Text>
          ))
        )}
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    `Relatorio semanal SalbCare: ${data?.purchases ?? 0} compras da Academy`,
  displayName: 'Relatorio semanal da Academy',
  previewData: {
    periodLabel: '10/09/2026 a 17/09/2026',
    purchases: 4,
    revenue: 'R$ 159,60',
    activeSubscriptions: 3,
    purchasesByProduct: [
      { title: 'Apostila de Ingles', count: 3 },
      { title: 'Apostila de Espanhol', count: 1 },
    ],
    subscriptions: [
      { plan: 'anual', status: 'active', renewsOn: '01/10/2026' },
      { plan: 'mensal', status: 'trialing', renewsOn: '24/09/2026' },
    ],
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '600px' }
const h1 = { color: '#0A1628', fontSize: '22px', margin: '0 0 4px' }
const h2 = { color: '#0A1628', fontSize: '16px', margin: '20px 0 8px' }
const muted = { color: '#5A6472', fontSize: '13px', margin: '0 0 8px' }
const card = {
  border: '1px solid #E4E1D8',
  borderRadius: '12px',
  padding: '16px',
  margin: '16px 0',
}
const label = { color: '#5A6472', fontSize: '12px', margin: '0' }
const value = { color: '#0A1628', fontSize: '20px', fontWeight: 700, margin: '2px 0 0' }
const line = { color: '#0A1628', fontSize: '13px', margin: '0 0 4px' }
const hr = { borderColor: '#E4E1D8', margin: '20px 0' }
