export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Each role layout (admin/trainer/client) provides its own sidebar, header,
  // and background. This wrapper is intentionally minimal to avoid z-index
  // stacking conflicts between a parent header and child fixed sidebars.
  return <>{children}</>;
}
