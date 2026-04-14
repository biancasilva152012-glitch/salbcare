import SEOHead from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlogTeleconsultaMedica = () => (
  <>
    <SEOHead
      title="Teleconsulta Médica: Como Atender Online"
      description="Guia completo sobre teleconsulta médica no Brasil. Regulamentação do CFM, como montar seu consultório virtual e atender pacientes de forma legal e segura."
      canonical="/blog/teleconsulta-medica"
      ogType="article"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "Teleconsulta Médica: Como Atender Online de Forma Legal",
        description: "Tudo sobre telemedicina no Brasil: regulamentação CFM 2.314/2022, plataformas, receituário digital e como começar.",
        author: { "@type": "Organization", name: "SalbCare" },
        publisher: { "@type": "Organization", name: "SalbCare", url: "https://salbcare.com.br" },
        datePublished: "2026-04-14",
        mainEntityOfPage: "https://salbcare.com.br/blog/teleconsulta-medica",
      }}
    />
    <article className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-12 space-y-8">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Blog
        </Link>

        <header className="space-y-3">
          <p className="text-xs text-primary font-semibold uppercase tracking-wider">Telemedicina</p>
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight">
            Teleconsulta Médica: Como Atender Pacientes Online de Forma Legal e Segura
          </h1>
          <p className="text-muted-foreground text-base">
            A telemedicina é regulamentada no Brasil desde 2022. Saiba como montar seu consultório virtual e atender com segurança jurídica.
          </p>
          <time className="text-xs text-muted-foreground" dateTime="2026-04-14">14 de abril de 2026</time>
        </header>

        <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">O que é teleconsulta médica?</h2>
          <p>
            A teleconsulta é o atendimento médico realizado a distância, por meio de tecnologias de comunicação (videochamada). Permite consultas, acompanhamentos, emissão de receitas e atestados digitais, sem a presença física do paciente no consultório.
          </p>

          <h2 className="text-xl font-semibold text-foreground">Regulamentação: o que diz o CFM?</h2>
          <p>
            A <strong>Resolução CFM 2.314/2022</strong> regulamenta a telemedicina no Brasil. Os principais pontos são:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>É obrigatório o <strong>consentimento informado</strong> do paciente</li>
            <li>O médico deve estar inscrito no CRM do estado onde atende</li>
            <li>O prontuário eletrônico é obrigatório</li>
            <li>Receitas digitais devem ter <strong>assinatura eletrônica ICP-Brasil</strong> ou equivalente</li>
            <li>Em emergências, o paciente deve ser encaminhado para atendimento presencial</li>
          </ul>

          <h2 className="text-xl font-semibold text-foreground">Como montar seu consultório virtual</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Escolha uma plataforma segura como o <strong>SalbCare</strong></li>
            <li>Configure seu perfil com CRM, especialidade e link do Google Meet</li>
            <li>Defina seus horários de atendimento</li>
            <li>Receba agendamentos e atenda diretamente pela plataforma</li>
          </ol>

          <h2 className="text-xl font-semibold text-foreground">Vantagens para o médico autônomo</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Sem comissão:</strong> 100% do valor da consulta é seu</li>
            <li><strong>Agenda integrada:</strong> controle de horários e pacientes em um só lugar</li>
            <li><strong>Prontuário + receituário:</strong> documentação digital com validade legal</li>
            <li><strong>Gestão financeira:</strong> acompanhe ganhos e impostos com mentoria de IA</li>
          </ul>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row gap-3">
          <Button asChild className="gradient-primary font-semibold gap-2">
            <Link to="/cadastro">
              Começar agora — 7 dias grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/consulta-online/medico">Ver médicos disponíveis</Link>
          </Button>
        </div>
      </div>
    </article>
  </>
);

export default BlogTeleconsultaMedica;
