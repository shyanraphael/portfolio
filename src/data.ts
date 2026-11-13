export const profile = {
  name: 'Shyan Wijesekera',
  first: 'Shyan',
  last: 'Wijesekera',
  tagline: 'I build features that hold up, then I test them until they do.',
  intro:
    'Intern Software Engineer at Verdentra and BSc (Hons) Computer Science undergraduate at IIT. I work across development and QA on live internal and client projects with .NET, React, Next.js, Playwright and Selenium.',
  email: 'shyanraphael@gmail.com',
  linkedin: 'https://www.linkedin.com/in/shyan-wijesekera',
  github: 'https://github.com/shyanraphael',
  cv: '/Shyan_Wijesekera_CV.pdf' as string,
  location: 'Colombo',
};

export const roles = ['software engineer', 'QA automation engineer', 'full stack builder', 'bug hunter'];

export type Cat = 'backend' | 'frontend' | 'testing' | 'cloud' | 'practice';

export const categories: { id: 'all' | Cat; label: string }[] = [
  { id: 'all', label: 'Everything' },
  { id: 'backend', label: 'Backend' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'testing', label: 'Testing' },
  { id: 'cloud', label: 'Cloud' },
  { id: 'practice', label: 'Practice' },
];

export const skills: { name: string; cat: Cat }[] = [
  { name: 'C#', cat: 'backend' },
  { name: '.NET 8', cat: 'backend' },
  { name: 'Azure Functions', cat: 'backend' },
  { name: 'EF Core', cat: 'backend' },
  { name: 'SQL Server', cat: 'backend' },
  { name: 'REST APIs', cat: 'backend' },
  { name: 'Python', cat: 'backend' },
  { name: 'Java', cat: 'backend' },
  { name: 'React', cat: 'frontend' },
  { name: 'Next.js', cat: 'frontend' },
  { name: 'TypeScript', cat: 'frontend' },
  { name: 'JavaScript', cat: 'frontend' },
  { name: 'Tailwind CSS', cat: 'frontend' },
  { name: 'HTML & CSS', cat: 'frontend' },
  { name: 'Figma', cat: 'frontend' },
  { name: 'Kotlin', cat: 'frontend' },
  { name: 'Playwright', cat: 'testing' },
  { name: 'Selenium', cat: 'testing' },
  { name: 'Test automation', cat: 'testing' },
  { name: 'Regression testing', cat: 'testing' },
  { name: 'Manual testing', cat: 'testing' },
  { name: 'Microsoft Azure', cat: 'cloud' },
  { name: 'Azure DevOps', cat: 'cloud' },
  { name: 'Git', cat: 'cloud' },
  { name: 'AWS (Cloud Practitioner prep)', cat: 'cloud' },
  { name: 'Agile', cat: 'practice' },
  { name: 'Scrum', cat: 'practice' },
  { name: 'Software design docs', cat: 'practice' },
  { name: 'Client communication', cat: 'practice' },
  { name: 'Ownership', cat: 'practice' },
];

/** the chips that fall into the hero */
export const heroChips: { name: string; cat: Cat }[] = [
  { name: 'C#', cat: 'backend' },
  { name: '.NET 8', cat: 'backend' },
  { name: 'React', cat: 'frontend' },
  { name: 'Playwright', cat: 'testing' },
  { name: 'Azure Functions', cat: 'backend' },
  { name: 'TypeScript', cat: 'frontend' },
  { name: 'Selenium', cat: 'testing' },
  { name: 'Next.js', cat: 'frontend' },
  { name: 'SQL Server', cat: 'backend' },
  { name: 'Python', cat: 'backend' },
  { name: 'Tailwind', cat: 'frontend' },
  { name: 'Git', cat: 'cloud' },
  { name: 'EF Core', cat: 'backend' },
  { name: 'Test automation', cat: 'testing' },
  { name: 'Azure DevOps', cat: 'cloud' },
  { name: 'Java', cat: 'backend' },
  { name: 'Kotlin', cat: 'frontend' },
  { name: 'Scrum', cat: 'practice' },
];

export const marquee = [
  'Shipped 30+ pull requests',
  'Owned 30+ QA tickets from report to retest',
  'Five projects in parallel',
  'Every deadline met',
  'Developer and QA in one',
];

/** sample suite for the interactive runner — synthetic, written for the demo */
export const tests = [
  { name: 'login redirects to the dashboard', ms: 820, flaky: false },
  { name: 'candidate list filters by skill', ms: 1140, flaky: false },
  { name: 'report export downloads a valid file', ms: 1380, flaky: true },
  { name: 'payroll totals match the ledger', ms: 960, flaky: false },
  { name: 'mobile menu keeps keyboard focus', ms: 700, flaky: false },
  { name: 'timeline renders without layout shift', ms: 1040, flaky: false },
];

export const experience = [
  {
    role: 'Intern Software Engineer',
    sub: 'Development & QA',
    org: 'Verdentra',
    period: 'May 2026 – present',
    points: [
      'Dual developer and QA role across five parallel projects, meeting every deadline.',
      'Shipped 30+ pull requests: new features and bug fixes in team codebases.',
      'Raised 30+ QA tickets through manual and automated testing, owning each from report to retest.',
      'Learned .NET, Selenium and Playwright on live projects and ramped up on the QA framework.',
      'Worked directly with a client team to clarify requirements and deliver testing on time.',
    ],
  },
  {
    role: 'Full Stack Web Development Intern',
    sub: 'Web applications',
    org: 'Astrosoft',
    period: 'Feb – Apr 2026',
    points: [
      'Built and maintained web applications with Next.js, React, TypeScript and Tailwind CSS.',
      'Implemented UI components, responsive layouts and client-side functionality.',
    ],
  },
  {
    role: 'BSc (Hons) Computer Science',
    sub: 'Undergraduate',
    org: 'Informatics Institute of Technology, University of Westminster',
    period: '2024 – present',
    points: [
      'Foundation Certificate in Computing (2024).',
      'G.C.E. Ordinary Level, St. Sebastian’s College, Moratuwa (2023).',
    ],
  },
];

type Link = { label: string; href: string };

export const projects: {
  id: string;
  title: string;
  kind: string;
  blurb: string;
  detail: string;
  stack: string[];
  links: Link[];
  cover: string;
}[] = [
  {
    id: 'bus',
    title: 'SriMaps',
    kind: 'Progressive web app and Android',
    blurb: 'Find any bus in Sri Lanka by number or route, in Sinhala, Tamil and English.',
    detail:
      'Designed end to end with use case, activity, sequence, class and rich picture diagrams, then built as a progressive web app and an Android app. The interface works in three languages so riders can search in the one they actually use.',
    stack: ['React', 'TypeScript', 'Tailwind', 'Kotlin'],
    links: [
      { label: 'Live site', href: 'https://www.srimaps.lk/' },
      { label: 'Android app', href: 'https://github.com/shyanraphael/srimaps-app' },
    ],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="d route" d="M24 150C96 150 92 60 172 60S256 150 322 112 372 52 384 40"/><circle class="d" cx="24" cy="150" r="8"/><circle class="d" cx="172" cy="60" r="8"/><circle class="d" cx="322" cy="112" r="8"/><circle class="d" cx="384" cy="40" r="8"/><circle class="bus" r="10" fill="currentColor" stroke="none"/></svg>',
  },
  {
    id: 'campus',
    title: 'Smart Campus API',
    kind: 'REST API, university coursework',
    blurb: 'Rooms and the sensors inside them, served over a clean REST interface.',
    detail:
      'A campus-wide REST interface for managing rooms and the sensors deployed in them, built on JAX-RS with an embedded Grizzly server. Resource-based URLs, correct HTTP semantics and no external server or database.',
    stack: ['Java', 'JAX-RS', 'Grizzly', 'REST'],
    links: [{ label: 'Source code', href: 'https://github.com/shyanraphael/smartcampus-api' }],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="d" d="M70 100H170M170 100V48H270M170 100V152H270M270 48H330M270 152H330"/><rect class="d" x="30" y="76" width="48" height="48" rx="10"/><rect class="d" x="282" y="28" width="48" height="40" rx="10"/><rect class="d" x="282" y="132" width="48" height="40" rx="10"/><circle class="d" cx="350" cy="48" r="9"/><circle class="d" cx="350" cy="152" r="9"/></svg>',
  },
  {
    id: 'merch',
    title: 'Merch Platform',
    kind: 'E-commerce web app',
    blurb: 'Product listing, cart, checkout, filtering and real-time search.',
    detail:
      'A storefront with product listing, cart, checkout, sorting, filtering and real-time search, wrapped in scroll-driven motion built with GSAP and Lenis.',
    stack: ['React', 'TypeScript', 'Tailwind', 'GSAP', 'Lenis'],
    links: [],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect class="d" x="36" y="24" width="96" height="120" rx="14"/><rect class="d" x="152" y="44" width="96" height="120" rx="14"/><rect class="d" x="268" y="24" width="96" height="120" rx="14"/><path class="d" d="M36 176h56M152 176h36M268 176h48"/></svg>',
  },
  {
    id: 'talent',
    title: 'Talent Management Platform',
    kind: 'Internal product, QA automation',
    blurb: 'End-to-end Playwright checks next to manual testing, before every release.',
    detail:
      'Automated end-to-end checks with Playwright alongside manual testing, and caught edge-case defects before release. Built on .NET 8, Azure Functions, EF Core, SQL Server and React.',
    stack: ['.NET 8', 'Azure Functions', 'EF Core', 'SQL Server', 'React', 'Playwright'],
    links: [],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="d" d="M36 52l12 12 22-26M96 52h268"/><path class="d" d="M36 104l12 12 22-26M96 104h220"/><path class="d" d="M36 156l12 12 22-26M96 156h250"/></svg>',
  },
  {
    id: 'recruit',
    title: 'AI-Assisted Recruitment Platform',
    kind: 'Internal product, development and QA',
    blurb: 'Features and fixes shipped through pull requests, then tested for regressions.',
    detail:
      'Built features and fixed bugs shipped through pull requests, then tested every change to catch regressions before release. Next.js and TypeScript on the front, Azure Functions, Python and SQL Server behind it.',
    stack: ['Next.js', 'TypeScript', 'Tailwind', 'Azure Functions', 'Python', 'SQL Server'],
    links: [],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path class="d" d="M36 36h328M72 84h256M116 132h168M164 176h72"/><circle class="d" cx="200" cy="108" r="6"/></svg>',
  },
  {
    id: 'payroll',
    title: 'Enterprise HR and Payroll',
    kind: 'Client project, QA testing',
    blurb: 'Client-facing features tested and defects logged inside agreed timelines.',
    detail:
      'Tested client-facing features with Selenium and manual passes, logged defects within agreed timelines, and worked directly with the client team to understand their needs and priorities.',
    stack: ['Selenium', 'Manual testing'],
    links: [],
    cover:
      '<svg viewBox="0 0 400 200" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect class="d" x="40" y="96" width="44" height="80" rx="8"/><rect class="d" x="112" y="56" width="44" height="120" rx="8"/><rect class="d" x="184" y="80" width="44" height="96" rx="8"/><rect class="d" x="256" y="32" width="44" height="144" rx="8"/><path class="d" d="M28 184h344"/></svg>',
  },
];

/* which projects use a skill: whole-word match, so "Java" never matches "JavaScript" */
const tokens = (s: string) => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
const covers = (a: string[], b: string[]) => {
  const [small, big] = a.length <= b.length ? [a, b] : [b, a];
  return small.length > 0 && small.every((t) => big.includes(t));
};
export const skillProjects = (skill: string) =>
  projects.filter((p) => p.stack.some((s) => covers(tokens(s), tokens(skill)))).map((p) => p.id);

export const article = {
  title: 'AI Can Make Mistakes Too: Why You Must Verify AI-Generated Code',
  where: 'Published on Verdentra’s website',
  href: 'https://www.verdentra.com/article/verify-ai-generated-code/' as string,
};

export const community = [
  { org: 'AIESEC IIT', role: 'Internal Campaigns Team Leader' },
  { org: 'Toastmasters IIT', role: 'Member' },
  { org: 'IEEE IIT Computer Science Society', role: 'Member' },
  { org: 'Leo Club Homagama', role: 'Design Team' },
];

export const certifications = [
  'Foundational C# with Microsoft (freeCodeCamp)',
  'HTML, CSS, and JavaScript: Building the Web',
  'Scrum: Advanced',
  'AWS Certified Cloud Practitioner Cert Prep',
  'Project Management Foundations',
  'Scrum: The Basics',
  'Learning REST APIs',
  'Introduction to Prompt Engineering for Generative AI',
];
