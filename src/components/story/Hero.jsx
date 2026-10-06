import { motion } from "framer-motion";
import { story } from "../../data/index.js";

export default function Hero() {
  const { hero } = story;
  return (
    <section className="hero">
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
        <div className="hero-grid" />
      </div>

      <div className="container hero-inner">
        <motion.p
          className="eyebrow"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {hero.kicker}
        </motion.p>
        <motion.h1
          className="hero-title"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          From <span className="gradient-text">Idea</span> to{" "}
          <span className="gradient-text">Impact</span>
        </motion.h1>
        <motion.p
          className="hero-subtitle"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          className="hero-scroll-cue"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <span>{hero.scrollCue}</span>
          <div className="hero-scroll-cue-line" />
        </motion.div>
      </div>
    </section>
  );
}
