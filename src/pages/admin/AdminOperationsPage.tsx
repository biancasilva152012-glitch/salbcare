import AdminLayout from "@/components/admin/AdminLayout";
import AdminOperationsManager from "@/components/admin/AdminOperationsManager";
import AdminProfessionalsBoard from "@/components/admin/AdminProfessionalsBoard";

const AdminOperationsPage = () => (
  <AdminLayout>
    <div className="space-y-6">
      <AdminProfessionalsBoard />
      <AdminOperationsManager />
    </div>
  </AdminLayout>
);

export default AdminOperationsPage;
