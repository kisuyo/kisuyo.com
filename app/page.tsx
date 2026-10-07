import Image from "next/image";
import styles from "./page.module.css";

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 20 20">
      <path
        d={diagonal ? "M5 15 15 5M5 5h10v10" : "M4 10h12m-5-5 5 5-5 5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main">Skip to content</a>

      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Kisuyo home">
          <span className={styles.brandMark} aria-hidden="true" />
          kisuyo
        </a>
        <nav aria-label="Social links" className={styles.socials}>
          <a href="https://github.com/kisuyo" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://x.com/KisuyoTT" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://discord.com/users/503533204259733504" target="_blank" rel="noopener noreferrer">Discord</a>
        </nav>
      </header>

      <main id="main" className={styles.main} tabIndex={-1}>
        <section aria-labelledby="intro-title" className={styles.hero}>
          <h1 id="intro-title">Hey, I&apos;m <span className={styles.pastel}>Igor.</span></h1>
          <p>I am a full stack software developer.</p>
          <div className={styles.actions}>
            <a className={styles.primaryAction} href="https://github.com/kisuyo?tab=repositories" target="_blank" rel="noopener noreferrer">Explore my work <Arrow /></a>
            <a className={styles.secondaryAction} href="https://discord.com/users/503533204259733504" target="_blank" rel="noopener noreferrer">Let&apos;s talk <Arrow diagonal /></a>
          </div>
        </section>

        <section id="work" aria-labelledby="current-project" className={styles.work}>
          <h2 id="current-project">Currently building<span aria-hidden="true">.</span></h2>
          <a className={styles.project} href="https://orbi.gg" target="_blank" rel="noopener noreferrer">
            <span className={styles.projectMark} aria-hidden="true">
              <Image src="/branding/orbi-sphere.svg" alt="" width={64} height={64} />
            </span>
            <span className={styles.projectCopy}>
              <span className={styles.projectTitle}>Orbi</span>
              <span className={styles.projectDescription}>Your personal trading companion. Build crypto bots, follow signals, and run your strategy.</span>
            </span>
            <span className={styles.projectArrow}><Arrow diagonal /></span>
          </a>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>kisuyo.com</span>
        <a href="https://github.com/kisuyo" target="_blank" rel="noopener noreferrer">Find me on GitHub <Arrow diagonal /></a>
      </footer>
      <div className={styles.horizon} aria-hidden="true" />
    </div>
  );
}
