import { Link } from "react-router-dom";
import { BookOpen, Mail, Settings, ShieldCheck, Smartphone, Users } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";

const guides = [
  { icon: Smartphone, title: "Instalar no celular", text: "Abra Instalar SalbCare. No iPhone, use Safari e Adicionar à Tela de Início. No Android, toque em Instalar app.", to: "/instalar", action: "Ver instalação" },
  { icon: Users, title: "Criar uma conta", text: "Em Operação, abra Contas e acessos. Preencha os dados e o convite será enviado para o e-mail informado.", to: "/admin/operacao?area=contas", action: "Abrir contas" },
  { icon: Mail, title: "Conferir e-mails", text: "E-mail pendente significa que a pessoa ainda não confirmou o endereço do convite. E-mail confirmado indica acesso validado.", to: "/admin/operacao?area=contas", action: "Ver pendências" },
  { icon: ShieldCheck, title: "Liberar administrador", text: "Busque uma conta confirmada, toque em Liberar admin e confirme. Remova o acesso pelo mesmo local.", to: "/admin/operacao?area=contas", action: "Gerenciar acessos" },
  { icon: BookOpen, title: "Entender os números", text: "Pacientes mostra o total cadastrado. Consultas considera o mês atual. Receitas e despesas somam os lançamentos do mês atual.", to: "/admin/operacao", action: "Ver Operação" },
  { icon: Settings, title: "Configurações", text: "Use Configurações para opções gerais da plataforma. Alterações sensíveis continuam protegidas por acesso administrativo.", to: "/admin/settings", action: "Abrir configurações" },
];

const AdminHelpPage = () => (
  <AdminLayout>
    <div className="space-y-6">
      <header><p className="admin-eyebrow">Ajuda</p><h1 className="mt-1 text-2xl sm:text-3xl">Como administrar o SalbCare</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Orientações rápidas para contas, acessos, indicadores e instalação no celular.</p></header>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map(({ icon: Icon, title, text, to, action }) => <section key={title} className="admin-card flex flex-col p-5"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent"><Icon className="h-5 w-5 text-secondary" /></span><h2 className="mt-4 text-lg">{title}</h2><p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{text}</p><Button asChild variant="outline" className="mt-5 min-h-12 w-full"><Link to={to}>{action}</Link></Button></section>)}
      </div>
    </div>
  </AdminLayout>
);

export default AdminHelpPage;