/**
 * Landing page - Home NoteMind AI
 * Tema coerente con il resto dell'app (dark mode)
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/Button";
import { useTranslation } from "@/contexts/LanguageContext";

export default function Home() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.03, 0.06, 0.03],
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-pink-500 to-blue-600 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-16"
        >
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {t("home.title")}
            </h1>
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">{t("home.beta")}</span>
          </div>
          <div className="flex gap-4 items-center">
            <a
              href="https://github.com/Gabry848/NoteMind-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline font-medium">GitHub</span>
            </a>
            <Link href="/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-gray-800">
                {t("home.login")}
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                {t("home.startFree")}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Hero Section */}
        <div className="text-center max-w-5xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <span className="text-7xl mb-6 inline-block">🧠</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight"
          >
            {t("home.hero.title")}
            <br />
            {t("home.hero.subtitle")}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            {t("home.hero.description")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="min-w-[200px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
              >
                🚀 {t("home.signUp")}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[200px] bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 text-white backdrop-blur-sm"
              >
                {t("home.accessAccount")}
              </Button>
            </Link>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500"
          >
            {t("home.tagline")}
          </motion.p>
        </div>

        {/* Features Grid - Espanse */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-24"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            {t("home.features.title")}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="📄"
              title={t("home.features.uploadDocs.title")}
              description={t("home.features.uploadDocs.description")}
              gradient="from-blue-500 to-cyan-500"
            />
            <FeatureCard
              icon="💬"
              title={t("home.features.multiChat.title")}
              description={t("home.features.multiChat.description")}
              gradient="from-purple-500 to-pink-500"
            />
            <FeatureCard
              icon="📊"
              title={t("home.features.summaries.title")}
              description={t("home.features.summaries.description")}
              gradient="from-emerald-500 to-teal-500"
            />
            <FeatureCard
              icon="📝"
              title={t("home.features.quiz.title")}
              description={t("home.features.quiz.description")}
              gradient="from-orange-500 to-red-500"
            />
            <FeatureCard
              icon="🔍"
              title={t("home.features.search.title")}
              description={t("home.features.search.description")}
              gradient="from-indigo-500 to-blue-500"
            />
            <FeatureCard
              icon="📁"
              title={t("home.features.organization.title")}
              description={t("home.features.organization.description")}
              gradient="from-pink-500 to-rose-500"
            />
          </div>
        </motion.div>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-24"
        >
          <h3 className="text-3xl font-bold text-center text-white mb-12">
            {t("home.howItWorks.title")}
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="1"
              title={t("home.howItWorks.step1.title")}
              description={t("home.howItWorks.step1.description")}
              icon="📤"
            />
            <StepCard
              number="2"
              title={t("home.howItWorks.step2.title")}
              description={t("home.howItWorks.step2.description")}
              icon="💡"
            />
            <StepCard
              number="3"
              title={t("home.howItWorks.step3.title")}
              description={t("home.howItWorks.step3.description")}
              icon="🎓"
            />
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-24"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard
              value="10+"
              label="Formati Supportati"
              icon="📄"
            />
            <StatCard
              value="∞"
              label="Domande"
              icon="💬"
            />
            <StatCard
              value="AI"
              label="Powered by Gemini"
              icon="🤖"
            />
            <StatCard
              value="Open"
              label="Source"
              icon="💻"
            />
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-12 text-center"
        >
          <h3 className="text-4xl font-bold text-white mb-4">
            {t("home.cta.title")}
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t("home.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="min-w-[220px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300"
              >
                {t("home.cta.startFree")}
              </Button>
            </Link>
            <Link href="/login">
              <Button
                variant="secondary"
                size="lg"
                className="min-w-[220px] bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 text-white backdrop-blur-sm"
              >
                {t("home.haveAccount")}
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* GitHub Contribution Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3 }}
          className="mt-24 mb-24"
        >
          <div className="bg-gradient-to-r from-gray-800/50 via-gray-800/30 to-gray-800/50 backdrop-blur-sm rounded-3xl border border-gray-700/50 p-12 overflow-hidden relative"
          >
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-l from-blue-500/10 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-transparent rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-gray-300" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-center text-white mb-4">
                {t("home.github.title")}
              </h3>

              <p className="text-center text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                {t("home.github.description")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                <a
                  href="https://github.com/Gabry848/NoteMind-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="min-w-[220px] bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-blue-500/50 transition-all duration-300"
                  >
                    {t("home.github.giveStar")}
                  </Button>
                </a>
                <a
                  href="https://github.com/Gabry848/NoteMind-AI"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="secondary"
                    size="lg"
                    className="min-w-[220px] bg-gray-800/60 hover:bg-gray-700/60 border border-gray-700 text-white backdrop-blur-sm"
                  >
                    {t("home.github.contribute")}
                  </Button>
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <div className="text-2xl font-bold text-blue-400 mb-1">{t("home.github.openSource")}</div>
                  <p className="text-sm text-gray-400">{t("home.github.openSourceDesc")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <div className="text-2xl font-bold text-purple-400 mb-1">{t("home.github.active")}</div>
                  <p className="text-sm text-gray-400">{t("home.github.activeDesc")}</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-gray-800/30 border border-gray-700/30">
                  <div className="text-2xl font-bold text-pink-400 mb-1">{t("home.github.community")}</div>
                  <p className="text-sm text-gray-400">{t("home.github.communityDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-24 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm"
        >
          <p>{t("home.footer.madeWith")}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <p>{t("home.footer.copyright")}</p>
            <a 
              href="https://github.com/Gabry848/NoteMind-AI" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: string;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -5 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-300 group"
    >
      <div className={`text-5xl mb-4 inline-flex p-4 rounded-xl bg-gradient-to-r ${gradient} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-blue-400 transition-colors">
        {title}
      </h3>
      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

function StepCard({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="relative bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 hover:border-gray-600 transition-all duration-300"
    >
      <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
        {number}
      </div>
      <div className="text-4xl mb-4">{icon}</div>
      <h4 className="text-2xl font-bold text-white mb-3">{title}</h4>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StatCard({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -4 }}
      className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 text-center"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{label}</div>
    </motion.div>
  );
}
