import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Github, Linkedin, Download, ExternalLink, ArrowLeft } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import SkillsCloud, { type Skill } from '../components/resume/SkillsCloud';

const PDF_URL = '/Resume_Chia-Da-Liu.pdf';

const DOMAINS: { name: string; color: string; skills: string[] }[] = [
  { name: 'Languages', color: '#f0b35f', skills: ['C++', 'Python', 'C', 'TypeScript'] },
  {
    name: 'Systems & Low-level',
    color: '#9db4d8',
    skills: ['Embedded', 'Firmware', 'ptrace', 'CRIU', 'ROS', 'Intel DSA', 'Distributed Systems', 'High Availability'],
  },
  { name: 'ML / AI', color: '#e29ab8', skills: ['Diffusion Models', 'ControlNet', 'Dreambooth', 'Collaborative Filtering'] },
  { name: 'Web', color: '#79d6c6', skills: ['React', 'REST APIs', 'Selenium'] },
  { name: 'Cloud & Infra', color: '#a7adf0', skills: ['GCP', 'Kubernetes', 'Docker', 'Grafana'] },
];

const cloudSkills: Skill[] = DOMAINS.flatMap((d) => d.skills.map((label) => ({ label, color: d.color })));

const highlights = [
  'Member of Technical Staff — FlashBlade High Availability Team at Everpure (formerly Pure Storage).',
  'M.S. in Embedded & Cyber-Physical Systems, UC Irvine — GPA 4.0 / 4.0.',
  'Optimized the write data path of an enterprise distributed storage system with Intel DSA.',
  'Shipped projects across GenAI, low-level systems (a ptrace/CRIU debugger), and full-stack monitoring.',
];

const Resume: React.FC = () => {
  const [pdfError, setPdfError] = useState(false);
  const navigate = useNavigate();

  // Return the way we came — back to the exact spot on About if there's history,
  // otherwise fall back to the page itself.
  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/about');
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = PDF_URL;
    a.download = 'Resume_Chia-Da-Liu.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <PageTransition>
      <div className="bg-[#0a0a0b] text-white">
        {/* ── Constellation hero ── */}
        <section className="relative min-h-screen px-6 pt-28 pb-16 md:px-12">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(70% 60% at 70% 45%, rgba(240,179,95,0.07) 0%, transparent 60%)' }}
          />

          {/* Back — returns to the exact scroll position on About */}
          <div className="relative mx-auto mb-10 max-w-6xl">
            <button
              onClick={goBack}
              className="group inline-flex items-center gap-2 text-white/55 transition-colors hover:text-amber-300"
            >
              <ArrowLeft size={16} className="transition-transform duration-300 group-hover:-translate-x-1" />
              <span className="font-cormorant text-sm uppercase tracking-[0.3em]">Back</span>
            </button>
          </div>

          <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.15fr]">
            {/* identity */}
            <div>
              <span className="font-cormorant tracking-[0.45em] text-xs uppercase text-amber-300/80 pl-[0.45em]">
                Résumé
              </span>
              <h1 className="mt-4 font-cormorant text-6xl leading-none md:text-7xl">Andy Liu</h1>
              <p className="mt-4 font-cormorant text-xl text-white/70 md:text-2xl">
                Member of Technical Staff · Everpure <span className="text-white/40">(formerly Pure Storage)</span>
              </p>
              <p className="mt-3 max-w-md font-cormorant text-lg italic text-white/50">
                A systems engineer who builds for reliability — and a photographer who builds for light.
              </p>

              <div className="mt-7 flex flex-wrap gap-5 text-sm text-white/70">
                <a href="mailto:andy9998811@gmail.com" className="inline-flex items-center gap-2 transition-colors hover:text-amber-300">
                  <Mail size={16} /> Email
                </a>
                <a href="https://github.com/Yoppman" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-amber-300">
                  <Github size={16} /> GitHub
                </a>
                <a href="https://www.linkedin.com/in/andy9998811/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-amber-300">
                  <Linkedin size={16} /> LinkedIn
                </a>
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  onClick={download}
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-6 py-3 text-sm font-medium text-neutral-900 transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Download size={16} /> Download résumé
                </button>
                <a
                  href={PDF_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-medium text-white transition-colors hover:border-white/60"
                >
                  <ExternalLink size={16} /> Open PDF
                </a>
              </div>
            </div>

            {/* constellation */}
            <div>
              <SkillsCloud skills={cloudSkills} />
              <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-2">
                {DOMAINS.map((d) => (
                  <span key={d.name} className="inline-flex items-center gap-2 text-xs text-white/55">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                    {d.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <span className="absolute bottom-6 left-1/2 -translate-x-1/2 font-cormorant text-xs uppercase tracking-[0.3em] text-white/30">
            Drag your cursor through the skills
          </span>
        </section>

        {/* ── Highlights + readable skills ── */}
        <section className="border-t border-white/10 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto grid max-w-6xl gap-14 md:grid-cols-2">
            <div>
              <h2 className="mb-7 font-playfair text-3xl md:text-4xl">Highlights</h2>
              <ul className="space-y-5">
                {highlights.map((h) => (
                  <li key={h} className="flex gap-3 text-white/75">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                    <span className="leading-relaxed">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="mb-7 font-playfair text-3xl md:text-4xl">Skills</h2>
              <div className="space-y-5">
                {DOMAINS.map((d) => (
                  <div key={d.name}>
                    <p className="mb-2 flex items-center gap-2 font-cormorant text-sm uppercase tracking-wider text-white/50">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {d.skills.map((s) => (
                        <span
                          key={s}
                          className="rounded-full border px-3 py-1 text-xs text-white/80"
                          style={{ borderColor: `${d.color}55` }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Full PDF ── */}
        <section className="border-t border-white/10 px-6 py-20 md:px-12 md:py-24">
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 flex items-end justify-between gap-4">
              <h2 className="font-playfair text-3xl md:text-4xl">The full document</h2>
              <button onClick={download} className="inline-flex items-center gap-2 text-sm text-amber-300 transition-colors hover:text-amber-200">
                <Download size={16} /> Download
              </button>
            </div>
            {!pdfError ? (
              <div className="overflow-hidden rounded-2xl bg-white shadow-2xl">
                <iframe
                  src={`${PDF_URL}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                  title="Résumé"
                  className="h-[720px] w-full md:h-[920px]"
                  style={{ pointerEvents: 'none' }}
                  onError={() => setPdfError(true)}
                />
              </div>
            ) : (
              <div className="flex h-[420px] flex-col items-center justify-center rounded-2xl border border-white/15 text-center">
                <p className="mb-4 text-white/60">Preview unavailable.</p>
                <a href={PDF_URL} target="_blank" rel="noopener noreferrer" className="rounded-full bg-amber-400 px-6 py-2 text-sm text-neutral-900">
                  Open PDF
                </a>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageTransition>
  );
};

export default Resume;
