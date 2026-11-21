import Link from "next/link";

const AuthLayout = ({ children }: LayoutProps<"/">) => (
  <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
    <Link href="/" className="text-lg font-semibold">
      Crypto Sandbox
    </Link>
    <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">{children}</div>
  </main>
);

export default AuthLayout;
