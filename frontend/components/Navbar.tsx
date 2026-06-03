import Link from "next/link";
import { Button } from "@/components/ui/button";

interface NavbarProps {
  showCta?: boolean;
}

export function Navbar({ showCta = true }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-foreground"
        >
          Proply
        </Link>
        {showCta && (
          <Button
            nativeButton={false}
            render={<Link href="/match" />}
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            Get Started
          </Button>
        )}
      </div>
    </header>
  );
}
