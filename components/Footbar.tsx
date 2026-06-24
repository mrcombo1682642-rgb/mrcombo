"use client";

import Link from "next/link";

const FOOTER_SECTIONS = [
  {
    title: "NAVIGATION",
    links: [
      { label: "Staff", href: "/no-permission" },
      { label: "Memberlist", href: "/no-permission" },
      { label: "Search", href: "/search" },
      { label: "ToS", href: "/tos" },
    ],
  },
  {
    title: "EXTRAS",
    links: [
      { label: "Statistics", href: "/no-permission" },
      { label: "Ban List", href: "/no-permission" },
      { label: "Awards", href: "/no-permission" },
      { label: "Credits", href: "/no-permission" },
    ],
  },
  {
    title: "HELP",
    links: [
      { label: "Help Documents", href: "/help" },
      { label: "DMCA", href: "/help#dmca" },
      { label: "F.A.Q", href: "/help#faq" },
      { label: "Advertising", href: "/help#advertise" },
    ],
  },
  {
    title: "ACCOUNT",
    links: [
      { label: "Control Panel", href: "/no-permission" },
      { label: "Upgrade", href: "/upgrade" },
      { label: "Items", href: "/no-permission" },
    ],
  },
];

export default function Footer() {
  return (
    <>
      <style>{`
        .footer{background:#050a0f;border-top:1px solid #0d2030;
          padding:48px 24px 24px;font-family:'Inter',sans-serif;color:#b8cfd8}
        .footer-top{display:grid;grid-template-columns:1fr 1fr;gap:40px 24px;
          max-width:1100px;margin:0 auto}
        .footer-brand{grid-column:1/-1;display:flex;flex-direction:column;
          gap:16px;max-width:460px}
        .footer-brand img{height:60px;width:auto;object-fit:contain;
          object-position:left center;mix-blend-mode:lighten}
        .footer-brand p{font-size:14px;line-height:1.7;color:#6a8fa0}
        .footer-sections{grid-column:1/-1;display:grid;
          grid-template-columns:repeat(2,1fr);gap:32px 24px}
        .footer-section-title{font-size:11px;font-weight:700;letter-spacing:2px;
          color:#fff;margin-bottom:14px;text-transform:uppercase}
        .footer-links{display:flex;flex-direction:column;gap:10px;
          list-style:none;margin:0;padding:0}
        .footer-link{display:flex;align-items:center;gap:10px;color:#4a7a94;
          font-size:14px;font-weight:500;text-decoration:none;cursor:pointer;
          transition:color .2s}
        .footer-link:hover{color:#00b4d8}
        .footer-divider{border:none;border-top:1px solid #0d2030;
          margin:36px auto 20px;max-width:1100px}
        .footer-bottom{max-width:1100px;margin:0 auto;display:flex;
          flex-direction:column;align-items:center;gap:6px;text-align:center}
        .footer-copyright{font-size:13px;color:#3d6a80;line-height:1.6}
        .footer-copyright a{color:#0077b6;text-decoration:none;font-weight:600}
        .footer-copyright a:hover{color:#00b4d8}
        .footer-theme{font-size:12px;color:#2a4a5a}
        .footer-theme a{color:#0077b6;text-decoration:none}
        @media(min-width:640px){.footer-sections{grid-template-columns:repeat(4,1fr)}}
        @media(max-width:400px){.footer{padding:36px 16px 20px}.footer-brand img{height:50px}}
      `}</style>

      <footer className="footer">
        <div className="footer-top">
          <div className="footer-brand">
            <img src="/logo.png" alt="MRCombo"/>
            <p>
              MRCombo is a community that offers many content suitable for you.
              Within our community you can find leaks, cracked tools, marketplace
              and many great things.
            </p>
          </div>

          <div className="footer-sections">
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title}>
                <div className="footer-section-title">{section.title}</div>
                <ul className="footer-links">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="footer-link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="footer-divider"/>

        <div className="footer-bottom">
          <p className="footer-copyright">
            <Link href="/">MRCombo</Link>, &copy; 2024-2026 All rights reserved. &nbsp;||&nbsp;
            Provides links to other sites on the internet and doesn&apos;t host any files itself.
          </p>
          <p className="footer-theme">
            Theme: <Link href="#">Ashen</Link>
          </p>
        </div>
      </footer>
    </>
  );
}