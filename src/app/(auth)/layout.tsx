import { RecuperationRedirect } from "@/components/auth/recuperation-redirect";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      {/* Un lien de reinitialisation peut atterrir sur n'importe lequel de ces
          ecrans, jeton compris. Le filet le renvoie au bon endroit. */}
      <RecuperationRedirect />
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
