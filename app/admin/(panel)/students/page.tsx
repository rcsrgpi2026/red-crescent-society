import { Download, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { deleteStudent } from "@/lib/admin-actions";
import {
  ResponsiveTable,
  type Column,
} from "@/components/admin/responsive-table";
import { Reveal } from "@/components/shared/reveal";
import { adminGetStudents } from "@/lib/queries";
import { formatDateTime } from "@/lib/constants";

export default async function AdminStudentsPage() {
  const students = await adminGetStudents();

  const columns: Column<(typeof students)[number]>[] = [
    {
      header: "Name",
      render: (s) => <span className="font-medium text-foreground">{s.name}</span>,
    },
    {
      header: "Roll",
      render: (s) => <span className="text-xs text-muted-foreground">{s.roll}</span>,
    },
    {
      header: "Session",
      render: (s) => <span className="text-xs text-muted-foreground">{s.session}</span>,
    },
    {
      header: "Department",
      render: (s) => <span className="text-sm">{s.department}</span>,
    },
    {
      header: "Phone",
      render: (s) => <span className="text-xs text-muted-foreground">{s.phone}</span>,
    },
    {
      header: "Email",
      render: (s) => (
        <span className="block max-w-[14rem] truncate text-xs text-muted-foreground">
          {s.email}
        </span>
      ),
    },
    {
      header: "Registered",
      render: (s) => (
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {formatDateTime(s.created_at)}
        </span>
      ),
    },
    {
      header: "Actions",
      render: (s) => (
        <ConfirmDelete
          action={deleteStudent}
          id={s.id}
          label="Delete"
          description={`Delete ${s.name}'s student account? This also removes their login account — it cannot be undone.`}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        icon={GraduationCap}
        title="Students"
        description="Students registered through the student portal. Download the list as a PDF anytime."
        tone="bg-gradient-to-br from-poly to-poly-soft/60"
        actions={
          <Button asChild variant="outline" size="sm">
            <a href="/admin/students/export" download>
              <Download className="mr-1.5 h-4 w-4" aria-hidden />
              Download PDF
            </a>
          </Button>
        }
      />

      <Reveal>
        <ResponsiveTable
          columns={columns}
          rows={students}
          keyFor={(s) => s.id}
          minWidth="min-w-[720px]"
          empty={
            <EmptyState
              icon={GraduationCap}
              title="No students registered yet"
              description="Students who create an account through the student portal will appear here."
            />
          }
        />
      </Reveal>
    </div>
  );
}
