export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <div className="p-4 text-sm text-[#AAAAAA]">Sidebar — coming in Task 5</div>
      <main>{children}</main>
    </div>
  );
}
