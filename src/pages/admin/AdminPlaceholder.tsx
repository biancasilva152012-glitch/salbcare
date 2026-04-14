import AdminLayout from "@/components/admin/AdminLayout";

const AdminPlaceholder = ({ title }: { title: string }) => (
  <AdminLayout>
    <div className="flex flex-col items-center justify-center py-20 space-y-3">
      <p className="text-lg font-semibold text-white/70">{title}</p>
      <p className="text-sm text-white/30">Em construção — disponível em breve</p>
    </div>
  </AdminLayout>
);

export default AdminPlaceholder;
