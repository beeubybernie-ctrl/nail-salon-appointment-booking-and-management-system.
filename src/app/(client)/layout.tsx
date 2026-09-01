import ClientLayout from "@/components/client/layout";

export default function ClientRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}