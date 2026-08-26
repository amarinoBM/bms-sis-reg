import Image from "next/image";
import Link from "next/link";

const LOGO_PATH = "/brand/brilliant-microschools-logo.png";

export function RegistrationHeader() {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="https://brilliantmicroschools.org"
          className="inline-flex shrink-0 items-center"
          aria-label="Brilliant Microschools — home"
        >
          <Image
            src={LOGO_PATH}
            alt="Brilliant Microschools"
            width={300}
            height={60}
            className="h-9 w-auto md:h-10"
            priority
          />
        </Link>
        <p className="text-label font-medium uppercase tracking-label text-muted-foreground">
          Student Registration
        </p>
      </div>
    </header>
  );
}
