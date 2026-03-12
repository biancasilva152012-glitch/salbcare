import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Calendar, Users, Video, DollarSign, Calculator, Scale, Clock, TrendingUp } from "lucide-react";
import PageContainer from "@/components/PageContainer";

const todayAppointments = [
  { id: 1, patient: "Maria Santos", time: "09:00", type: "Presencial" },
  { id: 2, patient: "João Oliveira", time: "10:30", type: "Telehealth" },
  { id: 3, patient: "Ana Costa", time: "14:00", type: "Presencial" },
  { id: 4, patient: "Pedro Lima", time: "16:00", type: "Telehealth" },
];

const quickActions = [
  { icon: Calendar, label: "Agenda", to: "/agenda", color: "from-primary to-secondary" },
  { icon: Users, label: "Pacientes", to: "/patients", color: "from-primary to-secondary" },
  { icon: Video, label: "Telehealth", to: "/telehealth", color: "from-primary to-secondary" },
  { icon: DollarSign, label: "Financeiro", to: "/financial", color: "from-primary to-secondary" },
  { icon: Calculator, label: "Contabilidade", to: "/accounting", color: "from-primary to-secondary" },
  { icon: Scale, label: "Jurídico", to: "/legal", color: "from-primary to-secondary" },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta</p>
          <h1 className="text-2xl font-bold">Dr. João Silva</h1>
        </motion.div>

        {/* Summary Cards */}
        <motion.div variants={item} className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">Consultas hoje</span>
            </div>
            <p className="text-2xl font-bold">{todayAppointments.length}</p>
          </div>
          <div className="glass-card p-4 space-y-1">
            <div className="flex items-center gap-2 text-success">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium text-muted-foreground">Receita mensal</span>
            </div>
            <p className="text-2xl font-bold">R$ 12.450</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Acesso rápido</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map(({ icon: Icon, label, to }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="glass-card flex flex-col items-center gap-2 p-4 transition-all hover:border-primary/50 active:scale-95"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Today's Appointments */}
        <motion.div variants={item}>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Consultas de hoje</h2>
          <div className="space-y-2">
            {todayAppointments.map((apt) => (
              <div key={apt.id} className="glass-card flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                    {apt.patient.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{apt.patient}</p>
                    <p className="text-xs text-muted-foreground">{apt.type}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-primary">{apt.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </PageContainer>
  );
};

export default Dashboard;
