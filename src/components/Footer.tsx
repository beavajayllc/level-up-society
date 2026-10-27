import { LogoLockup } from "./ui";

const columns = [
  {
    title: "Platform",
    links: ["Business Education", "Skills Training", "Funding & Credit", "Personal Growth", "Community"],
  },
  {
    title: "Company",
    links: ["About", "Memberships", "FAQ", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy Policy", "Delete account", "Terms of Service", "Refund Policy"],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-silver/8 bg-ink-2">
      <div className="container-x py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <LogoLockup />
            <p className="mt-5 max-w-xs text-[14.5px] leading-relaxed text-silver/45">
              Where entrepreneurs grow and live. Education and community —
              individual results vary.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-silver/35">
                  {col.title}
                </p>
                <ul className="mt-4 flex flex-col gap-3">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a
                        href={
                          link === "Privacy Policy"
                            ? "/privacy-policy"
                            : link === "Delete account"
                              ? "/delete-account"
                              : "#top"
                        }
                        className="text-[14px] text-silver/55 transition-colors duration-300 hover:text-chrome"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-silver/8 pt-8 sm:flex-row">
          <p className="text-[13px] text-silver/35">
            © 2026 Level Up Society. All rights reserved.
          </p>
          <p className="text-[13px] text-silver/35">
            Built for entrepreneurs who build for themselves.
          </p>
        </div>
      </div>
    </footer>
  );
}
